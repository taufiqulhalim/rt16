import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Get current balance (latest transaction)
    const latestTx = await db.transaction.findFirst({
      orderBy: { date: 'desc' },
      select: { balance: true },
    });

    const totalSaldo = latestTx ? latestTx.balance : 0;

    // Monthly income/expense for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const transactions = await db.transaction.findMany({
      where: { date: { gte: twelveMonthsAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, debit: true, credit: true, category: true },
    });

    // Group by month
    const monthlyData: { month: string; year: number; monthNum: number; income: number; expense: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const year = d.getFullYear();
      const monthNum = d.getMonth();

      const monthTxs = transactions.filter(tx => {
        const txMonth = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
        return txMonth === monthKey;
      });

      const income = monthTxs.reduce((s, tx) => s + tx.debit, 0);
      const expense = monthTxs.reduce((s, tx) => s + tx.credit, 0);

      monthlyData.push({
        month: monthNames[monthNum],
        year,
        monthNum,
        income,
        expense,
      });
    }

    // Category breakdown for current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthTxs = await db.transaction.findMany({
      where: { date: { gte: currentMonthStart } },
      select: { debit: true, credit: true, category: true },
    });

    const categoryMap = new Map<string, { income: number; expense: number }>();
    for (const tx of currentMonthTxs) {
      if (!categoryMap.has(tx.category)) {
        categoryMap.set(tx.category, { income: 0, expense: 0 });
      }
      const entry = categoryMap.get(tx.category)!;
      entry.income += tx.debit;
      entry.expense += tx.credit;
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      income: data.income,
      expense: data.expense,
      total: data.income + data.expense,
    }));

    // Overall totals
    const allTransactions = await db.transaction.findMany({
      select: { debit: true, credit: true },
    });
    const totalIncome = allTransactions.reduce((s, tx) => s + tx.debit, 0);
    const totalExpense = allTransactions.reduce((s, tx) => s + tx.credit, 0);

    // Recent transactions (last 5)
    const recentTransactions = await db.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        date: true,
        description: true,
        debit: true,
        credit: true,
        balance: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSaldo,
        totalIncome,
        totalExpense,
        monthlyData,
        categoryBreakdown,
        recentTransactions: recentTransactions.map(tx => ({
          ...tx,
          date: tx.date.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
