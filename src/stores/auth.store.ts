import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  user_role: string;
  subscription_tier: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRememberMe: (remember: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      rememberMe: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRememberMe: (remember) => set({ rememberMe: remember }),
      logout: () => set({ user: null, token: null, rememberMe: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

