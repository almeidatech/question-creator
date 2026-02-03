'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Question Creator</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <LoginForm
          onSuccess={() => {
            router.push('/admin/dashboard');
          }}
        />
      </div>
    </div>
  );
}
