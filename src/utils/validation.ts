/**
 * Validation schemas using Zod
 * Strict type-safe input validation
 */

import { z } from 'zod';

export const SignupSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(3, 'Email too short')
    .max(255, 'Email too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*]/, 'Password must contain special character'),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(3, 'Email too short')
    .max(255, 'Email too long'),
  password: z
    .string()
    .min(1, 'Password required'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Validate signup request
 */
export function validateSignup(data: unknown): { valid: true; data: SignupInput } | { valid: false; error: string } {
  const result = SignupSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors?.[0];
    const errorMessage = firstError?.message || 'Validation failed';
    return { valid: false, error: errorMessage };
  }
  return { valid: true, data: result.data };
}

/**
 * Validate login request
 */
export function validateLogin(data: unknown): { valid: true; data: LoginInput } | { valid: false; error: string } {
  const result = LoginSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors?.[0];
    const errorMessage = firstError?.message || 'Validation failed';
    return { valid: false, error: errorMessage };
  }
  return { valid: true, data: result.data };
}
