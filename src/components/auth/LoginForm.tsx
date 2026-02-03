'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginFormData } from '@/schemas/auth.schema';
import { useAuthStore, useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import {
  Button,
  Input,
  Checkbox,
  FormField,
} from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useI18n();
  const { darkMode } = useUIStore();
  const { setUser, setToken, setRememberMe } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema) as any,
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        setSubmitError(t('messages.invalidCredentials'));
        throw new Error(t('messages.invalidCredentials'));
      }

      const result = await response.json();
      setUser(result.user);
      setToken(result.token);
      setRememberMe(data.rememberMe);

      onSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Alert */}
      {submitError && (
        <div
          className={`p-4 rounded-lg border ${
            darkMode
              ? 'bg-red-950 border-red-700 text-red-200'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      {/* Email Field */}
      <FormField
        htmlFor="email"
        label={t('auth.emailAddress')}
        errorMessage={errors.email?.message}
        variant={errors.email ? 'error' : 'default'}
        required
      >
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
        />
      </FormField>

      {/* Password Field */}
      <FormField
        htmlFor="password"
        label={t('auth.password')}
        errorMessage={errors.password?.message}
        variant={errors.password ? 'error' : 'default'}
        required
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-3 p-1 rounded transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>

      {/* Remember Me */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="rememberMe"
          {...register('rememberMe')}
        />
        <label
          htmlFor="rememberMe"
          className={`text-sm cursor-pointer font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {t('auth.rememberMe30Days')}
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        fullWidth
        isLoading={isSubmitting}
        variant="primary"
      >
        {isSubmitting ? t('auth.signingIn') : t('auth.login')}
      </Button>

      {/* Sign Up Link */}
      <p
        className={`text-sm text-center ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {t('auth.dontHaveAccount')}{' '}
        <a
          href="/auth/signup"
          className={`font-medium hover:underline transition-colors ${
            darkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
          }`}
        >
          {t('auth.signup')}
        </a>
      </p>
    </form>
  );
};
