'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordRecoverySchema, PasswordRecoveryFormData } from '@/schemas/auth.schema';
import { useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import {
  Button,
  Input,
  FormField,
} from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordRecoveryFormProps {
  onSuccess?: () => void;
}

export const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({ onSuccess }) => {
  const { t } = useI18n();
  const { darkMode } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'recovery'>('email');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<PasswordRecoveryFormData>({
    resolver: zodResolver(PasswordRecoverySchema),
    mode: 'onChange',
  });

  const handleRequestCode = async () => {
    const email = getValues('email');
    try {
      const response = await fetch('/api/auth/request-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep('recovery');
      }
    } catch (error) {
      console.error('Failed to request recovery code:', error);
    }
  };

  const onSubmit = async (data: PasswordRecoveryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          verification_code: data.verification_code,
          new_password: data.new_password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          disabled={step === 'recovery'}
        />
      </FormField>

      {step === 'email' && (
        <Button
          type="button"
          onClick={handleRequestCode}
          fullWidth
          variant="primary"
        >
          {t('auth.sendingRecoveryCode')}
        </Button>
      )}

      {step === 'recovery' && (
        <>
          {/* Verification Code Field */}
          <FormField
            htmlFor="verification_code"
            label={t('auth.verificationCode')}
            errorMessage={errors.verification_code?.message}
            variant={errors.verification_code ? 'error' : 'default'}
            required
          >
            <Input
              id="verification_code"
              type="text"
              placeholder="000000"
              {...register('verification_code')}
            />
          </FormField>

          {/* New Password Field */}
          <FormField
            htmlFor="new_password"
            label={t('auth.newPassword')}
            errorMessage={errors.new_password?.message}
            variant={errors.new_password ? 'error' : 'default'}
            required
          >
            <div className="relative">
              <Input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('new_password')}
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

          {/* Confirm Password Field */}
          <FormField
            htmlFor="confirm_password"
            label={t('auth.confirmPassword')}
            errorMessage={errors.confirm_password?.message}
            variant={errors.confirm_password ? 'error' : 'default'}
            required
          >
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirm_password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3 top-3 p-1 rounded transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>

          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
            isLoading={isSubmitting}
            variant="primary"
          >
            {isSubmitting ? t('messages.redirecting') : t('auth.resetPassword')}
          </Button>

          <Button
            type="button"
            onClick={() => setStep('email')}
            fullWidth
            variant="secondary"
          >
            {t('common.back')}
          </Button>
        </>
      )}

      {/* Sign In Link */}
      <p
        className={`text-sm text-center ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {t('auth.forgotPassword')}{' '}
        <a
          href="/auth/login"
          className={`font-medium hover:underline transition-colors ${
            darkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
          }`}
        >
          {t('auth.login')}
        </a>
      </p>
    </form>
  );
};

