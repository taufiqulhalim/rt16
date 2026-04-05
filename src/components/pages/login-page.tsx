'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        toast.success(`Selamat datang, ${data.user.name}!`);
      } else {
        setError(data.message || 'Login gagal. Periksa email dan password.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistem Keuangan RT</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Laporan Kas & Pembukuan Keuangan</p>
        </div>

        <Card className="shadow-xl border-0 dark:border dark:border-gray-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
            <CardDescription>Masukkan kredensial Anda untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@rt16bungah.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </span>
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Demo Akun:</p>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p><span className="font-medium text-emerald-600 dark:text-emerald-400">Admin:</span> admin@rt16bungah.id / admin123</p>
                <p><span className="font-medium text-amber-600 dark:text-amber-400">Manager:</span> bendahara@rt16bungah.id / manager123</p>
                <p><span className="font-medium text-blue-600 dark:text-blue-400">Public:</span> warga@rt16bungah.id / public123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
