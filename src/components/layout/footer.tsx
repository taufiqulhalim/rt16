'use client';

import { Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Keuangan RT 16 RW 06 Desa Bungah</span>
        </div>
        <p>Kecamatan Bungah &mdash; Kabupaten Gresik</p>
      </div>
    </footer>
  );
}
