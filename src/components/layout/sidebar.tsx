'use client';

import { useAuthStore, useAppStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  FileText,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  Building2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'public'] },
  { id: 'laporan-tahunan', label: 'Laporan Tahunan', icon: CalendarDays, roles: ['admin', 'manager', 'public'] },
  { id: 'laporan-bulanan', label: 'Laporan Bulanan', icon: CalendarRange, roles: ['admin', 'manager', 'public'] },
  { id: 'laporan-harian', label: 'Laporan Harian', icon: FileText, roles: ['admin', 'manager', 'public'] },
  { type: 'separator' as const, roles: ['admin', 'manager'] },
  { id: 'kelola-transaksi', label: 'Kelola Transaksi', icon: PlusCircle, roles: ['admin', 'manager'] },
  { type: 'separator' as const, roles: ['admin'] },
  { id: 'kelola-user', label: 'Kelola User', icon: Users, roles: ['admin'] },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { currentPage, sidebarOpen, setSidebarOpen, setCurrentPage } = useAppStore();

  if (!user) return null;

  const filteredMenu = menuItems.filter((item) => {
    if ('roles' in item && item.roles) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  const roleBadgeColor = user.role === 'admin' ? 'bg-red-500' : user.role === 'manager' ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-30',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Keuangan RT</h2>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Sistem Pembukuan</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <Badge variant="secondary" className={cn('text-white text-[10px] px-1.5 py-0', roleBadgeColor)}>
                {user.role.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Menu */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-3 space-y-1">
            {filteredMenu.map((item, idx) => {
              if ('type' in item && item.type === 'separator') {
                return <Separator key={idx} className="my-2 bg-gray-100 dark:bg-gray-800" />;
              }
              const menuItem = item as { id: string; label: string; icon: any };
              const Icon = menuItem.icon;
              const isActive = currentPage === menuItem.id;

              return (
                <button
                  key={menuItem.id}
                  onClick={() => setCurrentPage(menuItem.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive && 'text-emerald-600 dark:text-emerald-400')} />
                  {menuItem.label}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </aside>
    </>
  );
}
