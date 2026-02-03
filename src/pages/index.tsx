'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect based on auth status
    if (user) {
      router.push('/admin/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Question Creator
        </h1>
        <p className="text-gray-600 mb-8">
          {user ? 'Redirecting to dashboard...' : 'Redirecting to login...'}
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
