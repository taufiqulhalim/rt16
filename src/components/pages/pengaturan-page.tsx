'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, Building2, MapPin, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function PengaturanPage() {
  const [form, setForm] = useState({
    rt_name: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    initial_balance: '',
    period_start: '',
    period_end: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setForm((prev) => ({ ...prev, ...d.settings }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success('Pengaturan berhasil disimpan');
      else toast.error('Gagal menyimpan pengaturan');
    } catch { toast.error('Terjadi kesalahan'); }
    setSaving(false);
  };

  if (loading) {
    return <div className="space-y-4">{[1,2].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-30 bg-gray-100 dark:bg-gray-800 rounded" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5" /> Pengaturan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasi sistem keuangan RT</p>
      </div>

      {/* RT Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Informasi RT
          </CardTitle>
          <CardDescription className="text-xs">Data identitas RT yang akan tampil di laporan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Nama RT</Label>
              <Input value={form.rt_name} onChange={(e) => setForm({ ...form, rt_name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Desa / Kelurahan</Label>
              <Input value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Kecamatan</Label>
              <Input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Kabupaten / Kota</Label>
              <Input value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" /> Pengaturan Keuangan
          </CardTitle>
          <CardDescription className="text-xs">Saldo awal dan periode pembukuan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Saldo Awal (Rp)</Label>
              <Input type="number" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Periode Mulai</Label>
              <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Periode Akhir</Label>
              <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Preview Header Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">PEMBUKUAN KAS KEUANGAN {form.rt_name?.toUpperCase()}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{form.desa?.toUpperCase()} &mdash; {form.kecamatan?.toUpperCase()} &mdash; {form.kabupaten?.toUpperCase()}</p>
            <Separator className="my-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Periode: {form.period_start || '...'} s/d {form.period_end || '...'} | Saldo Awal: Rp {parseInt(form.initial_balance || '0').toLocaleString('id-ID')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Button>
    </div>
  );
}
