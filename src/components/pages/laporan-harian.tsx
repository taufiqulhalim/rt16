'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

interface Summary {
  saldoAwal: number;
  totalDebit: number;
  totalCredit: number;
  saldoAkhir: number;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LaporanHarianPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ saldoAwal: 0, totalDebit: 0, totalCredit: 0, saldoAkhir: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, perPage: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const doFetch = useCallback(async (page: number = 1, showLoading = true) => {
    const params = new URLSearchParams({
      reportType: 'harian',
      page: String(page),
      perPage: String(pagination.perPage),
    });
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    try {
      const res = await fetch(`/api/transactions?${params}`);
      const d = await res.json();
      setTransactions(d.data || []);
      setSummary(d.summary || { saldoAwal: 0, totalDebit: 0, totalCredit: 0, saldoAkhir: 0 });
      setPagination(d.pagination || { page: 1, perPage: 15, total: 0, totalPages: 1 });
    } catch {}
    if (showLoading) setLoading(false);
  }, [search, category, dateFrom, dateTo, pagination.perPage]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching pattern
  useEffect(() => { doFetch(1, true); }, [doFetch]);

  const goToPage = (p: number) => { if (p >= 1 && p <= pagination.totalPages) doFetch(p, false); };

  const categoryColors: Record<string, string> = {
    Pemasukan: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Pengeluaran: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Saldo Awal': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Saldo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Kas Harian</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detail transaksi keuangan per hari</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/api/export?reportType=harian&format=xlsx', '_blank')}>
          <Download className="w-3.5 h-3.5" /> Download Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Saldo Awal', value: summary.saldoAwal, color: 'text-gray-700 dark:text-gray-300' },
          { label: 'Total Pemasukan', value: summary.totalDebit, color: 'text-green-600 dark:text-green-400' },
          { label: 'Total Pengeluaran', value: summary.totalCredit, color: 'text-red-600 dark:text-red-400' },
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="Cari uraian transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8 text-xs" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Kategori</SelectItem>
                <SelectItem value="Pemasukan" className="text-xs">Pemasukan</SelectItem>
                <SelectItem value="Pengeluaran" className="text-xs">Pengeluaran</SelectItem>
                <SelectItem value="Saldo" className="text-xs">Saldo</SelectItem>
                <SelectItem value="Saldo Awal" className="text-xs">Saldo Awal</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSearch(''); setCategory('all'); setDateFrom(''); setDateTo(''); }}>Reset Filter</Button>
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setLoading(true); doFetch(1, true); }}>Terapkan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 w-10">No</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Tanggal</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Uraian</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Kategori</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Debit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Kredit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-800/50">
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  transactions.map((t, i) => (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2 px-3 text-xs text-gray-500">{(pagination.page - 1) * pagination.perPage + i + 1}</td>
                      <td className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2 px-3 text-xs text-gray-900 dark:text-white max-w-[250px] truncate">{t.description}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className={`text-[10px] ${categoryColors[t.category] || categoryColors.Lainnya}`}>
                          {t.category}
                        </Badge>
                      </td>
                      <td className={`py-2 px-3 text-xs text-right font-medium whitespace-nowrap ${t.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                      </td>
                      <td className={`py-2 px-3 text-xs text-right font-medium whitespace-nowrap ${t.credit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-xs text-right font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">{formatCurrency(t.balance)}</td>
                    </tr>
                  ))
                )}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs text-gray-400">Tidak ada data ditemukan</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 font-semibold">
                  <td colSpan={4} className="py-2.5 px-3 text-xs text-gray-700 dark:text-gray-300">JUMLAH</td>
                  <td className="py-2.5 px-3 text-xs text-right text-green-600 dark:text-green-400">{formatCurrency(summary.totalDebit)}</td>
                  <td className="py-2.5 px-3 text-xs text-right text-red-600 dark:text-red-400">{formatCurrency(summary.totalCredit)}</td>
                  <td className="py-2.5 px-3 text-xs text-right text-blue-600 dark:text-blue-400">{formatCurrency(summary.saldoAkhir)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} data)
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goToPage(1)} disabled={pagination.page <= 1}>
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="px-2 text-xs font-medium">{pagination.page}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goToPage(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages}>
                  <ChevronsRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
