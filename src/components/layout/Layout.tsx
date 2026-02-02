'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore, useUIStore } from '@/stores';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
  currentRoute?: string;
  requireAuth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentRoute = '/',
  requireAuth = true,
}) => {
  const { user, logout } = useAuthStore();
  const { darkMode } = useUIStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Redirect to login if auth is required and user is not logged in
  React.useEffect(() => {
    if (requireAuth && !user) {
      router.push('/auth/login');
    }
  }, [user, requireAuth, router]);

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
      <Header user={user} onLogout={handleLogout} />
      <div className="flex flex-1">
        <Sidebar currentRoute={currentRoute} />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
