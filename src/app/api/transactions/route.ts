import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

async function recalculateBalances(fromDate?: Date) {
  const where: Prisma.TransactionWhereInput = {};
  if (fromDate) {
    where.date = { gte: fromDate };
  }

  // Get the last balance before fromDate (if filtering)
  let lastBalance = 0;
  if (fromDate) {
    const prevTx = await db.transaction.findFirst({
      where: { date: { lt: fromDate } },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });
    if (prevTx) {
      lastBalance = prevTx.balance;
    }
  }

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: 'asc' },
    select: { id: true, debit: true, credit: true },
  });

  let runningBalance = lastBalance;
  for (const tx of transactions) {
    runningBalance += tx.debit - tx.credit;
    await db.transaction.update({
      where: { id: tx.id },
      data: { balance: runningBalance },
    });
  }
}

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
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';

    // Build where clause
    const where: Prisma.TransactionWhereInput = {};

    if (search) {
      where.description = { contains: search };
    }
    if (category) {
      where.category = category;
    }
    if (dateFrom) {
      where.date = { ...((where.date as Prisma.DateTimeNullableFilter) || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.date = { ...((where.date as Prisma.DateTimeNullableFilter) || {}), lte: new Date(dateTo + 'T23:59:59.999Z') };
    }

    // Annual report
    if (reportType === 'tahunan') {
      const years = year ? [parseInt(year)] : [];
      let yearFilter: Prisma.TransactionWhereInput = {};
      if (years.length > 0) {
        yearFilter = {
          date: {
            gte: new Date(`${years[0]}-01-01`),
            lte: new Date(`${years[0]}-12-31T23:59:59.999Z`),
          },
        };
      }

      const allTransactions = await db.transaction.findMany({
        where: { ...where, ...yearFilter },
        orderBy: { date: 'asc' },
      });

      // Group by year
      const yearMap = new Map<number, { year: number; totalDebit: number; totalCredit: number; saldoAkhir: number; count: number }>();

      for (const tx of allTransactions) {
        const y = tx.date.getFullYear();
        if (!yearMap.has(y)) {
          yearMap.set(y, { year: y, totalDebit: 0, totalCredit: 0, saldoAkhir: 0, count: 0 });
        }
        const entry = yearMap.get(y)!;
        entry.totalDebit += tx.debit;
        entry.totalCredit += tx.credit;
        entry.saldoAkhir = tx.balance;
        entry.count += 1;
      }

      const data = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

      // Get saldoAwal (balance before the first transaction)
      let saldoAwal = 0;
      if (allTransactions.length > 0) {
        const firstTx = allTransactions[0];
        saldoAwal = firstTx.balance - firstTx.debit + firstTx.credit;
      }

      const totalDebit = data.reduce((sum, d) => sum + d.totalDebit, 0);
      const totalCredit = data.reduce((sum, d) => sum + d.totalCredit, 0);
      const saldoAkhir = data.length > 0 ? data[data.length - 1].saldoAkhir : 0;

      return NextResponse.json({
        success: true,
        reportType: 'tahunan',
        data,
        pagination: { page: 1, perPage: data.length, total: data.length, totalPages: 1 },
        summary: { saldoAwal, totalDebit, totalCredit, saldoAkhir },
      });
    }

    // Monthly report
    if (reportType === 'bulanan') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const startOfYear = new Date(`${targetYear}-01-01`);
      const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

      // Get balance before start of year
      const prevTx = await db.transaction.findFirst({
        where: { date: { lt: startOfYear } },
        orderBy: { date: 'desc' },
        select: { balance: true },
      });
      const saldoAwal = prevTx ? prevTx.balance : 0;

      const allTransactions = await db.transaction.findMany({
        where: {
          ...where,
          date: {
            gte: startOfYear,
            lte: endOfYear,
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
          },
        },
        orderBy: { date: 'asc' },
      });

      // Group by month
      const monthMap = new Map<number, { month: number; monthName: string; totalDebit: number; totalCredit: number; saldoAkhir: number; count: number }>();
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      for (const tx of allTransactions) {
        const m = tx.date.getMonth();
        if (!monthMap.has(m)) {
          monthMap.set(m, { month: m, monthName: monthNames[m], totalDebit: 0, totalCredit: 0, saldoAkhir: 0, count: 0 });
        }
        const entry = monthMap.get(m)!;
        entry.totalDebit += tx.debit;
        entry.totalCredit += tx.credit;
        entry.saldoAkhir = tx.balance;
        entry.count += 1;
      }

      let data = Array.from(monthMap.values()).sort((a, b) => a.month - b.month);

      // Filter by month if specified
      if (month) {
        const m = parseInt(month) - 1;
        data = data.filter(d => d.month === m);
      }

      const totalDebit = allTransactions.reduce((sum, tx) => sum + tx.debit, 0);
      const totalCredit = allTransactions.reduce((sum, tx) => sum + tx.credit, 0);
      const saldoAkhir = allTransactions.length > 0 ? allTransactions[allTransactions.length - 1].balance : saldoAwal;

      return NextResponse.json({
        success: true,
        reportType: 'bulanan',
        year: targetYear,
        data,
        pagination: { page: 1, perPage: data.length, total: data.length, totalPages: 1 },
        summary: { saldoAwal, totalDebit, totalCredit, saldoAkhir },
      });
    }

    // Daily report (default) with pagination
    const skip = (page - 1) * perPage;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: perPage,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.transaction.count({ where }),
    ]);

    // Calculate summary
    // Get balance before the first transaction in the filtered set
    let saldoAwal = 0;
    if (transactions.length > 0) {
      const allFiltered = await db.transaction.findMany({
        where,
        orderBy: { date: 'asc' },
        select: { balance: true, debit: true, credit: true },
        take: 1,
      });
      if (allFiltered.length > 0) {
        saldoAwal = allFiltered[0].balance - allFiltered[0].debit + allFiltered[0].credit;
      }
    } else {
      // If no transactions, get the last balance overall
      const lastTx = await db.transaction.findFirst({
        orderBy: { date: 'desc' },
        select: { balance: true },
      });
      saldoAwal = lastTx ? lastTx.balance : 0;
    }

    // Recalculate from all filtered transactions
    const allFilteredForSummary = await db.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
      select: { debit: true, credit: true, balance: true },
    });

    const totalDebit = allFilteredForSummary.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = allFilteredForSummary.reduce((sum, tx) => sum + tx.credit, 0);
    const saldoAkhir = allFilteredForSummary.length > 0 ? allFilteredForSummary[allFilteredForSummary.length - 1].balance : saldoAwal;

    return NextResponse.json({
      success: true,
      reportType: 'harian',
      data: transactions.map(tx => ({
        id: tx.id,
        date: tx.date.toISOString(),
        description: tx.description,
        debit: tx.debit,
        credit: tx.credit,
        balance: tx.balance,
        category: tx.category,
        createdBy: tx.createdBy,
        creator: tx.creator,
        createdAt: tx.createdAt.toISOString(),
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      summary: { saldoAwal, totalDebit, totalCredit, saldoAkhir },
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin', 'manager']);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, description, debit, credit, category } = body;

    if (!date || !description) {
      return NextResponse.json(
        { success: false, message: 'Tanggal dan deskripsi wajib diisi' },
        { status: 400 }
      );
    }

    const debitAmount = parseFloat(debit) || 0;
    const creditAmount = parseFloat(credit) || 0;

    if (debitAmount === 0 && creditAmount === 0) {
      return NextResponse.json(
        { success: false, message: 'Debit atau kredit harus diisi' },
        { status: 400 }
      );
    }

    const txDate = new Date(date);

    // Get the last balance before this transaction date
    const prevTx = await db.transaction.findFirst({
      where: { date: { lt: txDate } },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });

    // Also check for transactions on the same date but earlier (by createdAt)
    const sameDateTx = await db.transaction.findFirst({
      where: { date: { lte: txDate } },
      orderBy: { date: 'desc', createdAt: 'desc' },
      select: { balance: true },
    });

    let newBalance: number;
    if (sameDateTx) {
      newBalance = sameDateTx.balance + debitAmount - creditAmount;
    } else if (prevTx) {
      newBalance = prevTx.balance + debitAmount - creditAmount;
    } else {
      newBalance = debitAmount - creditAmount;
    }

    const transaction = await db.transaction.create({
      data: {
        date: txDate,
        description,
        debit: debitAmount,
        credit: creditAmount,
        balance: newBalance,
        category: category || 'Lainnya',
        createdBy: user.id,
      },
    });

    // Recalculate balances from this date forward
    await recalculateBalances(txDate);

    // Re-fetch the transaction with updated balance
    const updatedTx = await db.transaction.findUnique({
      where: { id: transaction.id },
    });

    return NextResponse.json({
      success: true,
      data: updatedTx,
      message: 'Transaksi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
