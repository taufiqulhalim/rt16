'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';

interface Transaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const emptyForm = { date: '', description: '', debit: '0', credit: '0', category: 'Pemasukan' };

export default function KelolaTransaksiPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const doFetch = useCallback(async (q: string) => {
    const params = new URLSearchParams({ reportType: 'harian', perPage: '100' });
    if (q) params.set('search', q);
    try {
      const res = await fetch(`/api/transactions?${params}`);
      const d = await res.json();
      setTransactions(d.data || []);
    } catch {}
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching pattern
  useEffect(() => { doFetch(search); }, [search, doFetch]);

  const handleSave = async () => {
    if (!form.date || !form.description) {
      toast.error('Tanggal dan uraian wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const body = {
        date: form.date,
        description: form.description,
        debit: parseFloat(form.debit) || 0,
        credit: parseFloat(form.credit) || 0,
        category: form.category,
      };

      if (editing) {
        const res = await fetch(`/api/transactions/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) { toast.success('Transaksi berhasil diperbarui'); }
        else { const d = await res.json(); toast.error(d.message || 'Gagal memperbarui'); }
      } else {
        const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) { toast.success('Transaksi berhasil ditambahkan'); }
        else { const d = await res.json(); toast.error(d.message || 'Gagal menambahkan'); }
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setLoading(true);
      doFetch(search);
    } catch { toast.error('Terjadi kesalahan'); }
    setSaving(false);
  };

  const handleEdit = (t: Transaction) => {
    setEditing(t.id);
    setForm({
      date: t.date.substring(0, 10),
      description: t.description,
      debit: String(t.debit),
      credit: String(t.credit),
      category: t.category,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Transaksi berhasil dihapus'); setLoading(true); doFetch(search); }
      else { toast.error('Gagal menghapus transaksi'); }
    } catch { toast.error('Terjadi kesalahan'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kelola Transaksi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tambah, edit, dan hapus data transaksi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4" /> Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Tanggal *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Uraian *</Label>
                <Input placeholder="Deskripsi transaksi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Debit (Pemasukan)</Label>
                  <Input type="number" placeholder="0" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Kredit (Pengeluaran)</Label>
                  <Input type="number" placeholder="0" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Saldo">Saldo</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Batal</Button>
              </DialogClose>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => { setLoading(true); doFetch(search); }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
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
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">No</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Tanggal</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Uraian</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Kategori</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Debit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Kredit</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Saldo</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-800/50">
                      {[1,2,3,4,5,6,7].map((j) => (
                        <td key={j} className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  transactions.map((t, i) => (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2 px-3 text-xs text-gray-500">{i + 1}</td>
                      <td className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2 px-3 text-xs text-gray-900 dark:text-white max-w-[200px] truncate">{t.description}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className={`text-[10px] ${
                          t.category === 'Pemasukan' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          t.category === 'Pengeluaran' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>{t.category}</Badge>
                      </td>
                      <td className={`py-2 px-3 text-xs text-right font-medium whitespace-nowrap ${t.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                      </td>
                      <td className={`py-2 px-3 text-xs text-right font-medium whitespace-nowrap ${t.credit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-xs text-right font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">{formatCurrency(t.balance)}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(t)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus transaksi &ldquo;{t.description}&rdquo;? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(t.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-gray-400 text-right">
            Menampilkan {transactions.length} transaksi
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
