import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import { PasswordRecoveryForm } from '@/components/auth';

export async function getServerSideProps() {
  return { props: {} };
}

export default function RecoveryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleRecoverySuccess = () => {
    router.push('/auth/login');
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

        {/* Recovery Form */}
        <div
          className={`rounded-lg border ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          } p-6 sm:p-8`}
        >
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('auth.resetPassword')}
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('auth.enterYourEmail')}
          </p>

          <PasswordRecoveryForm onSuccess={handleRecoverySuccess} />

          {/* Back to Login Link */}
          <div className={`mt-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>
              {t('auth.forgotPassword')}{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('auth.login')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
