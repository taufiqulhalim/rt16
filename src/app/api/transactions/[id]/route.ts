import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

async function recalculateBalances(fromDate: Date) {
  // Get the last balance before fromDate
  const prevTx = await db.transaction.findFirst({
    where: { date: { lt: fromDate } },
    orderBy: { date: 'desc' },
    select: { balance: true },
  });
  let lastBalance = prevTx ? prevTx.balance : 0;

  const transactions = await db.transaction.findMany({
    where: { date: { gte: fromDate } },
    orderBy: { date: 'asc', createdAt: 'asc' },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ['admin', 'manager']);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { date, description, debit, credit, category } = body;

    const txDate = date ? new Date(date) : existing.date;
    const debitAmount = debit !== undefined ? parseFloat(debit) : existing.debit;
    const creditAmount = credit !== undefined ? parseFloat(credit) : existing.credit;

    // Delete the old transaction first, recalculate, then create new one
    await db.transaction.delete({ where: { id } });

    // Recalculate from the earlier of old/new date
    const recalcDate = txDate < existing.date ? txDate : existing.date;
    await recalculateBalances(recalcDate);

    // Now create the updated transaction
    // Get the last balance before the new date
    const prevTx = await db.transaction.findFirst({
      where: { date: { lt: txDate } },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });
    const lastBalance = prevTx ? prevTx.balance : 0;

    const newBalance = lastBalance + debitAmount - creditAmount;

    const transaction = await db.transaction.create({
      data: {
        date: txDate,
        description: description || existing.description,
        debit: debitAmount,
        credit: creditAmount,
        balance: newBalance,
        category: category || existing.category,
        createdBy: existing.createdBy,
      },
    });

    // Recalculate balances from the transaction date
    await recalculateBalances(txDate);

    // Re-fetch with updated balance
    const updatedTx = await db.transaction.findUnique({
      where: { id: transaction.id },
    });

    return NextResponse.json({
      success: true,
      data: updatedTx,
      message: 'Transaksi berhasil diperbarui',
    });
  } catch (error) {
    console.error('Transaction PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ['admin', 'manager']);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.transaction.delete({ where: { id } });

    // Recalculate balances from the deleted transaction's date
    await recalculateBalances(existing.date);

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus',
    });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
