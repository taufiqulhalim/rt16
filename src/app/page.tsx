'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useAuthStore, useAppStore } from '@/stores';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import LoginPage from '@/components/pages/login-page';
import DashboardPage from '@/components/pages/dashboard-page';
import LaporanTahunanPage from '@/components/pages/laporan-tahunan';
import LaporanBulananPage from '@/components/pages/laporan-bulanan';
import LaporanHarianPage from '@/components/pages/laporan-harian';
import KelolaTransaksiPage from '@/components/pages/kelola-transaksi';
import KelolaUserPage from '@/components/pages/kelola-user';
import PengaturanPage from '@/components/pages/pengaturan-page';

function AppContent() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const { currentPage } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    'laporan-tahunan': <LaporanTahunanPage />,
    'laporan-bulanan': <LaporanBulananPage />,
    'laporan-harian': <LaporanHarianPage />,
    'kelola-transaksi': user.role !== 'public' ? <KelolaTransaksiPage /> : null,
    'kelola-user': user.role === 'admin' ? <KelolaUserPage /> : null,
    'pengaturan': user.role === 'admin' ? <PengaturanPage /> : null,
  };

  const currentPageContent = pages[currentPage];
  if (currentPageContent === undefined) {
    return <DashboardPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          {currentPageContent === null ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">Anda tidak memiliki akses ke halaman ini.</p>
            </div>
          ) : (
            currentPageContent
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AppContent />
    </ThemeProvider>
  );
}
