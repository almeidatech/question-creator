'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores';
import { useUIStore } from '@/stores';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, Heading1, Paragraph, Divider } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors ${
        darkMode
          ? 'bg-linear-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-linear-to-br from-primary-50 via-blue-50 to-indigo-100'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4 ${
              darkMode
                ? 'bg-primary-900 border border-primary-700'
                : 'bg-primary-100 border border-primary-200'
            }`}
          >
            <span className="text-2xl font-bold text-primary-600">QC</span>
          </div>
          <Heading1
            className={`mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            Question Creator
          </Heading1>
          <Paragraph
            className={darkMode ? 'text-gray-400' : 'text-gray-600'}
          >
            Manage exams and track student progress
          </Paragraph>
        </div>

        {/* Login Card */}
        <Card
          className={`p-8 shadow-xl ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-primary-100'
          }`}
        >
          <LoginForm
            onSuccess={() => {
              router.push('/admin/dashboard');
            }}
          />

          {/* Divider */}
          <Divider
            className={`my-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          />

          {/* Footer Links */}
          <div
            className={`text-center text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <p className="mb-4">
              By signing in, you agree to our{' '}
              <a
                href="#"
                className={`font-medium hover:underline ${
                  darkMode ? 'text-primary-400' : 'text-primary-600'
                }`}
              >
                Terms of Service
              </a>
            </p>
          </div>
        </Card>

        {/* Info Box */}
        <div
          className={`mt-6 p-4 rounded-lg border ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-gray-300'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <p className="text-sm font-medium mb-1">Demo Credentials</p>
          <p className="text-xs opacity-75">
            Use your registered email and password to sign in
          </p>
        </div>
      </div>
    </div>
  );
}
