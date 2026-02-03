'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordRecoverySchema, PasswordRecoveryFormData } from '@/schemas/auth.schema';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordRecoveryFormProps {
  onSuccess?: () => void;
}

export const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({ onSuccess }) => {
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 max-w-md mx-auto p-6 rounded-lg ${
        darkMode
          ? 'bg-gray-800 text-gray-100'
          : 'bg-white text-gray-900 border border-gray-200'
      }`}
    >
      <h2 className="text-2xl font-bold mb-6">Reset Password</h2>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          disabled={step === 'recovery'}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-3 py-2 rounded-md border transition-colors ${
            errors.email
              ? darkMode
                ? 'border-red-500 bg-red-950'
                : 'border-red-500 bg-red-50'
              : darkMode
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-300 bg-white'
          } disabled:opacity-50`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {step === 'email' && (
        <Button
          type="button"
          onClick={handleRequestCode}
          className="w-full"
        >
          Send Verification Code
        </Button>
      )}

      {step === 'recovery' && (
        <>
          {/* Verification Code */}
          <div>
            <label htmlFor="verification_code" className="block text-sm font-medium mb-2">
              Verification Code
            </label>
            <input
              id="verification_code"
              type="text"
              {...register('verification_code')}
              aria-invalid={errors.verification_code ? 'true' : 'false'}
              aria-describedby={errors.verification_code ? 'code-error' : undefined}
              className={`w-full px-3 py-2 rounded-md border transition-colors ${
                errors.verification_code
                  ? darkMode
                    ? 'border-red-500 bg-red-950'
                    : 'border-red-500 bg-red-50'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700'
                    : 'border-gray-300 bg-white'
              }`}
              placeholder="000000"
            />
            {errors.verification_code && (
              <p id="code-error" className="mt-1 text-sm text-red-500">
                {errors.verification_code.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                {...register('new_password')}
                aria-invalid={errors.new_password ? 'true' : 'false'}
                aria-describedby={errors.new_password ? 'password-error' : undefined}
                className={`w-full px-3 py-2 rounded-md border transition-colors pr-10 ${
                  errors.new_password
                    ? darkMode
                      ? 'border-red-500 bg-red-950'
                      : 'border-red-500 bg-red-50'
                    : darkMode
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-300 bg-white'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-2.5 p-1 rounded ${
                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && (
              <p id="password-error" className="mt-1 text-sm text-red-500">
                {errors.new_password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password')}
                aria-invalid={errors.confirm_password ? 'true' : 'false'}
                aria-describedby={errors.confirm_password ? 'confirm-error' : undefined}
                className={`w-full px-3 py-2 rounded-md border transition-colors pr-10 ${
                  errors.confirm_password
                    ? darkMode
                      ? 'border-red-500 bg-red-950'
                      : 'border-red-500 bg-red-50'
                    : darkMode
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-300 bg-white'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3 top-2.5 p-1 rounded ${
                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p id="confirm-error" className="mt-1 text-sm text-red-500">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('email')}
            className="w-full"
          >
            Back
          </Button>
        </>
      )}

      <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Remember your password?{' '}
        <a href="/auth/login" className="text-blue-500 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
};

