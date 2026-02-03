'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupSchema, SignupFormData } from '@/schemas/auth.schema';
import { useAuthStore, useUIStore } from '@/stores';
import {
  Button,
  Input,
  Checkbox,
  FormField,
} from '@/components/ui';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

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

  const password = watch('password') || '';
  const passwordStrength = calculatePasswordStrength(password);

  function calculatePasswordStrength(pwd: string): { level: number; label: string } {
    if (!pwd) return { level: 0, label: 'Weak' };
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <FormField
        htmlFor="email"
        label="Email Address"
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
        label="Password"
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
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>

      {/* Password Strength Indicator */}
      {password && (
        <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex-1 rounded-full h-1 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
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
            <span>{passwordStrength.label}</span>
          </div>
        </div>
      )}

      {/* Confirm Password Field */}
      <FormField
        htmlFor="confirm_password"
        label="Confirm Password"
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

      {/* Terms of Service */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="agreed_to_tos"
          {...register('agreed_to_tos')}
        />
        <label
          htmlFor="agreed_to_tos"
          className={`text-sm cursor-pointer font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          I agree to the{' '}
          <a href="/terms" className={`hover:underline ${darkMode ? 'text-primary-400' : 'text-primary-600'}`}>
            Terms of Service
          </a>
        </label>
      </div>
      {errors.agreed_to_tos && (
        <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          {errors.agreed_to_tos.message}
        </p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        fullWidth
        isLoading={isSubmitting}
        variant="primary"
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>

      {/* Sign In Link */}
      <p
        className={`text-sm text-center ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        Already have an account?{' '}
        <a
          href="/auth/login"
          className={`font-medium hover:underline transition-colors ${
            darkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
          }`}
        >
          Sign in
        </a>
      </p>
    </form>
  );
};

