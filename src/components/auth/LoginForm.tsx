'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginFormData } from '@/schemas/auth.schema';
import { useAuthStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { darkMode } = useUIStore();
  const { setUser, setToken, setRememberMe } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema) as any,
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
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
        throw new Error('Invalid credentials');
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 max-w-md mx-auto p-6 rounded-lg ${
        darkMode
          ? 'bg-gray-800 text-gray-100'
          : 'bg-white text-gray-900 border border-gray-200'
      }`}
    >
      <h2 className="text-2xl font-bold mb-6">Login</h2>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          {...(errors.email ? { 'aria-invalid': true } : {})}
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
            {...(errors.password ? { 'aria-invalid': true } : {})}
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
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          {...register('rememberMe')}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
        />
        <label htmlFor="rememberMe" className="text-sm cursor-pointer">
          Remember me
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Don't have an account?{' '}
        <a href="/auth/signup" className="text-blue-500 hover:underline">
          Sign up
        </a>
      </p>
    </form>
  );
};

