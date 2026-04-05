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
import { Plus, Pencil, Trash2, Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const emptyForm = { name: '', email: '', password: '', role: 'public' };

export default function KelolaUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const doFetch = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching pattern
  useEffect(() => { doFetch(); }, [doFetch]);

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nama dan email wajib diisi'); return; }
    setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;

      if (editing) {
        const res = await fetch(`/api/users/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) toast.success('User berhasil diperbarui');
        else { const d = await res.json(); toast.error(d.message || 'Gagal'); }
      } else {
        if (!form.password) { toast.error('Password wajib diisi untuk user baru'); setSaving(false); return; }
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) toast.success('User berhasil ditambahkan');
        else { const d = await res.json(); toast.error(d.message || 'Gagal'); }
      }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); setLoading(true); doFetch();
    } catch { toast.error('Terjadi kesalahan'); }
    setSaving(false);
  };

  const handleEdit = (u: User) => {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('User berhasil dinonaktifkan'); setLoading(true); doFetch(); }
      else toast.error('Gagal menonaktifkan user');
    } catch { toast.error('Terjadi kesalahan'); }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500 text-white',
    manager: 'bg-amber-500 text-white',
    public: 'bg-blue-500 text-white',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" /> Kelola User
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akun pengguna sistem</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4" /> Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Nama</Label>
                <Input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input type="email" placeholder="email@contoh.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Password {editing && '(kosongkan jika tidak diubah)'}</Label>
                <Input type="password" placeholder={editing ? '••••••••' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Akses Penuh</SelectItem>
                    <SelectItem value="manager">Manager - Kelola Transaksi</SelectItem>
                    <SelectItem value="public">Public - Hanya Lihat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild><Button variant="outline" size="sm">Batal</Button></DialogClose>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Admin', count: users.filter((u) => u.role === 'admin' && u.active).length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10' },
          { label: 'Manager', count: users.filter((u) => u.role === 'manager' && u.active).length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          { label: 'Public', count: users.filter((u) => u.role === 'public' && u.active).length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10' },
        ].map((item) => (
          <Card key={item.label} className={item.bg}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{item.count}</p>
              <p className={`text-xs font-medium ${item.color}`}>{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Terdaftar</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-800/50">
                      {[1,2,3,4,5].map((j) => <td key={j} className="py-3 px-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" /></td>)}
                    </tr>
                  ))
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2.5 px-3 text-xs font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge className={`text-[10px] ${roleColors[u.role]}`}>{u.role.toUpperCase()}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={u.active ? 'default' : 'secondary'} className={`text-[10px] ${u.active ? 'bg-green-500 text-white' : ''}`}>
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(u)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {u.active && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Nonaktifkan User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menonaktifkan user &ldquo;{u.name}&rdquo;?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(u.id)}>Nonaktifkan</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
