'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupSchema, SignupFormData } from '@/schemas/auth.schema';
import { useAuthStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { darkMode } = useUIStore();
  const { setUser, setToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    mode: 'onChange',
  });

  const password = watch('password');
  const passwordStrength = calculatePasswordStrength(password);

  function calculatePasswordStrength(pwd: string): { level: number; label: string } {
    let level = 0;
    if (pwd.length >= 8) level++;
    if (/[A-Z]/.test(pwd)) level++;
    if (/[a-z]/.test(pwd)) level++;
    if (/[0-9]/.test(pwd)) level++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { level, label: labels[level] || 'Weak' };
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          agreed_to_tos: data.agreed_to_tos,
        }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const result = await response.json();
      setUser(result.user);
      setToken(result.token);

      onSuccess?.();
    } catch (error) {
      console.error('Signup failed:', error);
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
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
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
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full px-3 py-2 rounded-md border transition-colors pr-10 ${
              errors.password
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
        {password && (
          <div className="mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-300 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength.level === 1
                      ? 'w-1/4 bg-red-500'
                      : passwordStrength.level === 2
                        ? 'w-1/2 bg-yellow-500'
                        : passwordStrength.level === 3
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-green-500'
                  }`}
                />
              </div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={16} />
            {errors.password.message}
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

      {/* Terms of Service */}
      <div className="flex items-center gap-2">
        <input
          id="agreed_to_tos"
          type="checkbox"
          {...register('agreed_to_tos')}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          aria-invalid={errors.agreed_to_tos ? 'true' : 'false'}
          aria-describedby={errors.agreed_to_tos ? 'tos-error' : undefined}
        />
        <label htmlFor="agreed_to_tos" className="text-sm cursor-pointer">
          I agree to the{' '}
          <a href="/terms" className="text-blue-500 hover:underline">
            Terms of Service
          </a>
        </label>
      </div>
      {errors.agreed_to_tos && (
        <p id="tos-error" className="text-sm text-red-500">
          {errors.agreed_to_tos.message}
        </p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Already have an account?{' '}
        <a href="/auth/login" className="text-blue-500 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
};

