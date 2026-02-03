import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import { SignupForm } from '@/components/auth';

export async function getServerSideProps() {
  return { props: {} };
}

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignupSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('common.appName')}
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('questions.subtitle')}
          </p>
        </div>

        {/* Signup Form */}
        <div
          className={`rounded-lg border ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          } p-6 sm:p-8`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('auth.signup')}
          </h2>

          <SignupForm onSuccess={handleSignupSuccess} />

        </div>

        {/* Help Text */}
        <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>
            {t('auth.agreeToTerms').split('Terms of Service')[0]}{' '}
            <button className="text-blue-600 hover:text-blue-700 underline">
              {t('footer.terms')}
            </button>
            {' '}and{' '}
            <button className="text-blue-600 hover:text-blue-700 underline">
              {t('footer.privacy')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
