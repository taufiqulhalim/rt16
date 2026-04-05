'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/stores';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d.data || d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 bg-gray-100 dark:bg-gray-800 rounded" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse"><CardContent className="p-6"><div className="h-72 bg-gray-100 dark:bg-gray-800 rounded" /></CardContent></Card>
          <Card className="animate-pulse"><CardContent className="p-6"><div className="h-72 bg-gray-100 dark:bg-gray-800 rounded" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const totalSaldo = data.totalSaldo || 0;
  const totalIncome = data.totalIncome || 0;
  const totalExpense = data.totalExpense || 0;
  const monthlyData = (data.monthlyData || []).map((m: any) => ({
    ...m,
    label: `${m.month} ${m.year}`,
    net: m.income - m.expense,
  }));
  const categoryBreakdown = data.categoryBreakdown || [];
  const recentTransactions = data.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo Saat Ini</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalSaldo)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Pemasukan</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalIncome)}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3 h-3 text-green-500" /> Seluruh periode</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Pengeluaran</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalExpense)}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><ArrowDownRight className="w-3 h-3 text-red-500" /> Seluruh periode</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net Income</p>
                <p className={`text-lg font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  {totalIncome - totalExpense >= 0 ? 'Surplus' : 'Defisit'}
                </Badge>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pemasukan vs Pengeluaran (12 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tren Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="net" name="Net Income" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribusi Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth: 1 }}>
                  {categoryBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Uraian</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Debit</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Kredit</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400">{formatDate(t.date)}</td>
                      <td className="py-2 px-2 text-xs text-gray-900 dark:text-white truncate max-w-[200px]">{t.description}</td>
                      <td className={`py-2 px-2 text-xs text-right font-medium ${t.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                      </td>
                      <td className={`py-2 px-2 text-xs text-right font-medium ${t.credit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                      </td>
                      <td className="py-2 px-2 text-xs text-right font-medium text-blue-600 dark:text-blue-400">{formatCurrency(t.balance)}</td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-xs text-gray-400">Belum ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
