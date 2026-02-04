/**
 * Authentication Middleware
 * Validates JWT tokens on protected routes
 */

import { NextApiRequest } from 'next';
import { AuthService } from '@/services/auth/auth.service';
import { RateLimitService } from '@/services/auth/rate-limit.service';

/**
 * Extract authorization header and get token
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Auth middleware result
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Validate JWT token from request
 */
export async function validateAuthToken(authHeader: string | undefined): Promise<AuthResult> {
  const token = extractToken(authHeader);
  if (!token) {
    return { authenticated: false, error: 'Missing bearer token' };
  }

  const verification = await AuthService.verifyToken(token);
  if (!verification.valid) {
    return { authenticated: false, error: verification.error };
  }

  return {
    authenticated: true,
    userId: verification.userId,
    email: verification.email,
  };
}

/**
 * Verify authentication and extract user ID from request
 * Convenience function for API route handlers
 * Returns null if request is not authenticated
 */
export async function verifyAuth(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization as string | undefined;
  console.log('[verifyAuth] Authorization header present:', !!authHeader);

  const result = await validateAuthToken(authHeader);
  console.log('[verifyAuth] Authentication result:', {
    authenticated: result.authenticated,
    hasUserId: !!result.userId,
    error: result.error
  });

  if (!result.authenticated || !result.userId) {
    return null;
  }

  return result.userId;
}

/**
 * Rate limit check for an IP/identifier
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const result = RateLimitService.isRateLimited(identifier);
  return {
    allowed: !result.limited,
    remaining: result.remaining,
    resetTime: result.resetTime,
  };
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(identifier: string): Record<string, string> {
  const status = RateLimitService.getStatus(identifier);
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': status.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000).toString(),
  };
}

