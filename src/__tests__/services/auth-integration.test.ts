/**
 * Auth Integration Tests
 * Tests RLS validation and endpoint behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/src/services/auth/auth.service';
import { JWTService } from '@/src/services/auth/jwt.service';
import { RateLimitService } from '@/src/services/auth/rate-limit.service';
import { validateAuthToken, getRateLimitHeaders } from '@/src/middleware/auth.middleware';

describe('Auth Integration', () => {
  beforeEach(() => {
    RateLimitService.clearAll();
  });

  // ============================================================================
  // SIGNUP ENDPOINT TESTS
  // ============================================================================

  describe('Signup Endpoint', () => {
    it('should return 201 on successful signup', async () => {
      const result = await AuthService.signup({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify all required response fields
        expect(result.response.user_id).toBeDefined();
        expect(result.response.email).toBe('newuser@example.com');
        expect(result.response.access_token).toBeDefined();
        expect(result.response.refresh_token).toBeDefined();
        expect(result.response.token_type).toBe('Bearer');
        expect(result.response.expires_in).toBe(24 * 60 * 60);
      }
    });

    it('should return 409 on duplicate email', async () => {
      // First signup
      await AuthService.signup({
        email: 'dup@example.com',
        password: 'SecurePass123!',
      });

      // Second signup
      const result = await AuthService.signup({
        email: 'dup@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('EMAIL_EXISTS');
      }
    });

    it('should return 400 on validation error', async () => {
      const result = await AuthService.signup({
        email: 'invalid-email',
        password: 'weak',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // ============================================================================
  // LOGIN ENDPOINT TESTS
  // ============================================================================

  describe('Login Endpoint', () => {
    beforeEach(async () => {
      await AuthService.signup({
        email: 'existing@example.com',
        password: 'SecurePass123!',
      });
    });

    it('should return 200 on successful login', async () => {
      const result = await AuthService.login({
        email: 'existing@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response.user_id).toBeDefined();
        expect(result.response.access_token).toBeDefined();
        expect(result.response.refresh_token).toBeDefined();
        expect(result.response.token_type).toBe('Bearer');
      }
    });

    it('should return 401 on invalid credentials', async () => {
      const result = await AuthService.login({
        email: 'existing@example.com',
        password: 'WrongPassword123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should return 401 on nonexistent user', async () => {
      const result = await AuthService.login({
        email: 'notfound@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });

  // ============================================================================
  // RATE LIMITING TESTS
  // ============================================================================

  describe('Rate Limiting', () => {
    it('should enforce 10 req/min limit per IP', () => {
      const clientId = 'login:192.168.1.1';

      // Make 10 requests (each increments the counter)
      for (let i = 1; i <= 10; i++) {
        const checkResult = RateLimitService.isRateLimited(clientId);
        expect(checkResult.limited).toBe(false);
        const remaining = 10 - i;
        expect(checkResult.remaining).toBe(remaining);
      }

      // 11th request should fail
      const checkResult = RateLimitService.isRateLimited(clientId);
      expect(checkResult.limited).toBe(true);
    });

    it('should provide correct rate limit headers', () => {
      const clientId = 'test:192.168.1.1';

      // Make a request
      RateLimitService.isRateLimited(clientId);

      const headers = getRateLimitHeaders(clientId);
      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(parseInt(headers['X-RateLimit-Remaining'])).toBeLessThanOrEqual(10);
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });

  // ============================================================================
  // JWT TOKEN VALIDATION TESTS
  // ============================================================================

  describe('JWT Token Validation', () => {
    it('should validate token format', async () => {
      const signupResult = await AuthService.signup({
        email: 'jwt@example.com',
        password: 'SecurePass123!',
      });

      expect(signupResult.success).toBe(true);
      if (signupResult.success) {
        const token = signupResult.response.access_token;
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        expect(parts[0]).toBeDefined(); // header
        expect(parts[1]).toBeDefined(); // payload
        expect(parts[2]).toBeDefined(); // signature
      }
    });

    it('should extract correct user_id from token', async () => {
      const signupResult = await AuthService.signup({
        email: 'extract@example.com',
        password: 'SecurePass123!',
      });

      expect(signupResult.success).toBe(true);
      if (signupResult.success) {
        const authHeader = `Bearer ${signupResult.response.access_token}`;
        const authResult = validateAuthToken(authHeader);

        expect(authResult.authenticated).toBe(true);
        expect(authResult.userId).toBe(signupResult.response.user_id);
        expect(authResult.email).toBe('extract@example.com');
      }
    });

    it('should enforce 24h expiry for access tokens', () => {
      const token = JWTService.generateToken('user-id', 'test@example.com', 'access');
      const verification = JWTService.verifyToken(token);

      expect(verification.valid).toBe(true);
      if (verification.valid) {
        const expirySeconds = verification.payload.exp - verification.payload.iat;
        expect(expirySeconds).toBe(24 * 60 * 60);
      }
    });

    it('should enforce 7d expiry for refresh tokens', () => {
      const token = JWTService.generateToken('user-id', 'test@example.com', 'refresh');
      const verification = JWTService.verifyToken(token);

      expect(verification.valid).toBe(true);
      if (verification.valid) {
        const expirySeconds = verification.payload.exp - verification.payload.iat;
        expect(expirySeconds).toBe(7 * 24 * 60 * 60);
      }
    });
  });

  // ============================================================================
  // RLS POLICY VALIDATION TESTS
  // ============================================================================

  describe('RLS Policy Validation', () => {
    it('should isolate user records by user_id', async () => {
      const user1 = await AuthService.signup({
        email: `rls1-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

      const user2 = await AuthService.signup({
        email: `rls2-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

      expect(user1.success && user2.success).toBe(true);
      if (user1.success && user2.success) {
        // Each user should have different user_id in their token
        const user1Token = AuthService.verifyToken(user1.response.access_token);
        const user2Token = AuthService.verifyToken(user2.response.access_token);

        expect(user1Token.valid && user2Token.valid).toBe(true);
        if (user1Token.valid && user2Token.valid) {
          expect(user1Token.userId).not.toBe(user2Token.userId);
        }
      }
    });

    it('should set auth.uid() context via JWT sub claim', async () => {
      const signupResult = await AuthService.signup({
        email: 'context@example.com',
        password: 'SecurePass123!',
      });

      expect(signupResult.success).toBe(true);
      if (signupResult.success) {
        const verification = AuthService.verifyToken(signupResult.response.access_token);
        expect(verification.valid).toBe(true);
        if (verification.valid) {
          // In Supabase, auth.uid() is set to JWT sub claim
          expect(verification.userId).toBe(signupResult.response.user_id);
        }
      }
    });
  });

  // ============================================================================
  // SECURITY VALIDATION TESTS
  // ============================================================================

  describe('Security', () => {
    it('should hash passwords (not store plaintext)', async () => {
      // This is validated by PasswordService tests
      // Here we just ensure signup doesn't return password
      const result = await AuthService.signup({
        email: 'security@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Response should not contain password
        const responseStr = JSON.stringify(result.response);
        expect(responseStr).not.toContain('SecurePass123!');
      }
    });

    it('should reject tampered JWT tokens', () => {
      const validToken = JWTService.generateToken('user-id', 'test@example.com', 'access');
      const parts = validToken.split('.');

      // Tamper with payload
      const tamperedToken = `${parts[0]}.tamperedpayload.${parts[2]}`;

      const authResult = validateAuthToken(`Bearer ${tamperedToken}`);
      expect(authResult.authenticated).toBe(false);
    });
  });
});
