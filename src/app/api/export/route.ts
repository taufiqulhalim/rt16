import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType') || 'harian';
    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';
    const format = searchParams.get('format') || 'xlsx';

    if (format !== 'xlsx') {
      return NextResponse.json(
        { success: false, message: 'Format hanya mendukung xlsx' },
        { status: 400 }
      );
    }

    // Get settings for header info
    const settingsRecords = await db.settings.findMany();
    const settings: Record<string, string> = {};
    for (const s of settingsRecords) {
      settings[s.key] = s.value;
    }

    const orgName = settings.organizationName || 'RT';
    const orgAddress = settings.organizationAddress || '';
    const reportTitle = reportType === 'tahunan'
      ? `Laporan Keuangan Tahunan ${year || new Date().getFullYear()}`
      : reportType === 'bulanan'
      ? `Laporan Keuangan Bulanan ${month || 'Semua'} ${year || new Date().getFullYear()}`
      : `Laporan Keuangan Harian`;

    const wb = XLSX.utils.book_new();

    if (reportType === 'tahunan') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const startOfYear = new Date(`${targetYear}-01-01`);
      const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

      // Get balance before year
      const prevTx = await db.transaction.findFirst({
        where: { date: { lt: startOfYear } },
        orderBy: { date: 'desc' },
        select: { balance: true },
      });
      const saldoAwal = prevTx ? prevTx.balance : 0;

      const transactions = await db.transaction.findMany({
        where: { date: { gte: startOfYear, lte: endOfYear } },
        orderBy: { date: 'asc' },
      });

      // Summary sheet
      const summaryData = [
        [orgName],
        [orgAddress],
        [],
        [reportTitle],
        [],
        ['Saldo Awal', saldoAwal],
        ['Total Pemasukan', transactions.reduce((s, t) => s + t.debit, 0)],
        ['Total Pengeluaran', transactions.reduce((s, t) => s + t.credit, 0)],
        ['Saldo Akhir', transactions.length > 0 ? transactions[transactions.length - 1].balance : saldoAwal],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

      // Monthly breakdown sheet
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthMap = new Map<number, { pemasukan: number; pengeluaran: number; saldoAkhir: number }>();
      for (let i = 0; i < 12; i++) monthMap.set(i, { pemasukan: 0, pengeluaran: 0, saldoAkhir: 0 });

      for (const tx of transactions) {
        const m = tx.date.getMonth();
        const entry = monthMap.get(m)!;
        entry.pemasukan += tx.debit;
        entry.pengeluaran += tx.credit;
        entry.saldoAkhir = tx.balance;
      }

      const monthData = [
        ['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo Akhir'],
        ...Array.from(monthMap.entries()).map(([m, d]) => [
          monthNames[m],
          d.pemasukan,
          d.pengeluaran,
          d.saldoAkhir,
        ]),
      ];
      const monthWs = XLSX.utils.aoa_to_sheet(monthData);
      XLSX.utils.book_append_sheet(wb, monthWs, 'Bulanan');

    } else if (reportType === 'bulanan') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : null;

      let startOfMonth: Date;
      let endOfMonth: Date;

      if (targetMonth !== null) {
        startOfMonth = new Date(targetYear, targetMonth, 1);
        endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      } else {
        startOfMonth = new Date(`${targetYear}-01-01`);
        endOfMonth = new Date(`${targetYear}-12-31T23:59:59.999Z`);
      }

      const prevTx = await db.transaction.findFirst({
        where: { date: { lt: startOfMonth } },
        orderBy: { date: 'desc' },
        select: { balance: true },
      });
      const saldoAwal = prevTx ? prevTx.balance : 0;

      const transactions = await db.transaction.findMany({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        orderBy: { date: 'asc' },
      });

      const totalDebit = transactions.reduce((s, t) => s + t.debit, 0);
      const totalCredit = transactions.reduce((s, t) => s + t.credit, 0);
      const saldoAkhir = transactions.length > 0 ? transactions[transactions.length - 1].balance : saldoAwal;

      // Summary sheet
      const summaryData = [
        [orgName],
        [orgAddress],
        [],
        [reportTitle],
        [],
        ['Saldo Awal', saldoAwal],
        ['Total Pemasukan', totalDebit],
        ['Total Pengeluaran', totalCredit],
        ['Saldo Akhir', saldoAkhir],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

      // Detail sheet
      const detailData = [
        ['No', 'Tanggal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo', 'Kategori'],
        ...transactions.map((tx, i) => [
          i + 1,
          tx.date.toISOString().split('T')[0],
          tx.description,
          tx.debit,
          tx.credit,
          tx.balance,
          tx.category,
        ]),
      ];
      const detailWs = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Detail');

    } else {
      // Daily report
      const transactions = await db.transaction.findMany({
        orderBy: { date: 'desc' },
      });

      let saldoAwal = 0;
      if (transactions.length > 0) {
        const allAsc = await db.transaction.findMany({
          orderBy: { date: 'asc' },
          select: { balance: true, debit: true, credit: true },
          take: 1,
        });
        if (allAsc.length > 0) {
          saldoAwal = allAsc[0].balance - allAsc[0].debit + allAsc[0].credit;
        }
      }

      const totalDebit = transactions.reduce((s, t) => s + t.debit, 0);
      const totalCredit = transactions.reduce((s, t) => s + t.credit, 0);
      const saldoAkhir = transactions.length > 0 ? transactions[0].balance : saldoAwal;

      // Summary sheet
      const summaryData = [
        [orgName],
        [orgAddress],
        [],
        [reportTitle],
        [],
        ['Saldo Awal', saldoAwal],
        ['Total Pemasukan', totalDebit],
        ['Total Pengeluaran', totalCredit],
        ['Saldo Akhir', saldoAkhir],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

      // Detail sheet
      const detailData = [
        ['No', 'Tanggal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo', 'Kategori'],
        ...transactions.map((tx, i) => [
          i + 1,
          tx.date.toISOString().split('T')[0],
          tx.description,
          tx.debit,
          tx.credit,
          tx.balance,
          tx.category,
        ]),
      ];
      const detailWs = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Detail');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Laporan_Keuangan_${reportType}_${year || new Date().getFullYear()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
