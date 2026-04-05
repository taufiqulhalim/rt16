'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface MonthData { month: number; monthName: string; totalDebit: number; totalCredit: number; saldoAkhir: number; count: number; }
interface Summary { saldoAwal: number; totalDebit: number; totalCredit: number; saldoAkhir: number; }

export default function LaporanBulananPage() {
  const [rawData, setRawData] = useState<MonthData[]>([]);
  const [summary, setSummary] = useState<Summary>({ saldoAwal: 0, totalDebit: 0, totalCredit: 0, saldoAkhir: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024');

  useEffect(() => {
    fetch(`/api/transactions?reportType=bulanan&year=${selectedYear}`)
      .then((r) => r.json())
      .then((d) => { setRawData(d.data || []); setSummary(d.summary || { saldoAwal: 0, totalDebit: 0, totalCredit: 0, saldoAkhir: 0 }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const filtered = useMemo(() => {
    if (!search) return rawData;
    return rawData.filter((t) => t.monthName.toLowerCase().includes(search.toLowerCase()));
  }, [rawData, search]);

  const years = ['2024', '2023', '2022', '2021', '2020', '2019'];

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-gray-100 dark:bg-gray-800 rounded" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Kas Bulanan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan keuangan per bulan - Tahun {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/api/export?reportType=bulanan&year=${selectedYear}&format=xlsx`, '_blank')}>
            <Download className="w-3.5 h-3.5" /> Download Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Saldo Awal', value: summary.saldoAwal, color: 'text-gray-700 dark:text-gray-300' },
          { label: 'Total Debit', value: summary.totalDebit, color: 'text-green-600 dark:text-green-400' },
          { label: 'Total Kredit', value: summary.totalCredit, color: 'text-red-600 dark:text-red-400' },
          { label: 'Saldo Akhir', value: summary.saldoAkhir, color: 'text-blue-600 dark:text-blue-400' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{item.label}</p>
              <p className={`text-sm font-bold ${item.color} mt-0.5`}>{formatCurrency(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pemasukan vs Pengeluaran Bulanan {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} labelStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="totalDebit" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCredit" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold">Data Laporan Bulanan</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="Cari bulan..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">No</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Bulan</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Jumlah Transaksi</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Total Debit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Total Kredit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.month} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 px-3 text-xs text-gray-500">{i + 1}</td>
                    <td className="py-2 px-3 text-xs font-semibold text-gray-900 dark:text-white">{t.monthName}</td>
                    <td className="py-2 px-3 text-xs text-center text-gray-600 dark:text-gray-400">{t.count} transaksi</td>
                    <td className="py-2 px-3 text-xs text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(t.totalDebit)}</td>
                    <td className="py-2 px-3 text-xs text-right font-medium text-red-600 dark:text-red-400">{formatCurrency(t.totalCredit)}</td>
                    <td className="py-2 px-3 text-xs text-right font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(t.saldoAkhir)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">Tidak ada data untuk tahun {selectedYear}</td></tr>}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 font-semibold">
                  <td colSpan={3} className="py-2.5 px-3 text-xs text-gray-700 dark:text-gray-300">JUMLAH</td>
                  <td className="py-2.5 px-3 text-xs text-right text-green-600 dark:text-green-400">{formatCurrency(summary.totalDebit)}</td>
                  <td className="py-2.5 px-3 text-xs text-right text-red-600 dark:text-red-400">{formatCurrency(summary.totalCredit)}</td>
                  <td className="py-2.5 px-3 text-xs text-right text-blue-600 dark:text-blue-400">{formatCurrency(summary.saldoAkhir)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
