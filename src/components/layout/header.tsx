'use client';

import { useAuthStore, useAppStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
export function Header() {
  const { user } = useAuthStore();
  const { setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();

  const handleExport = (format: string) => {
    window.open(`/api/export?reportType=harian&format=${format}`, '_blank');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6">
      <div className="flex items-center justify-between h-full">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden sm:block">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Laporan Keuangan RT
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pembukuan Kas RT 16 RW 06 Desa Bungah
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          {user.role !== 'public' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  Download Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
