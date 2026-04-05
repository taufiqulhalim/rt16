import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'public';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// App navigation state
interface AppState {
  currentPage: string;
  sidebarOpen: boolean;
  setCurrentPage: (page: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
