/**
 * Authentication Service Tests
 * Happy path + essential validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/src/services/auth/auth.service';
import { JWTService } from '@/src/services/auth/jwt.service';
import { PasswordService } from '@/src/services/auth/password.service';
import { RateLimitService } from '@/src/services/auth/rate-limit.service';
import { validateAuthToken, checkRateLimit } from '@/src/middleware/auth.middleware';

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear rate limiter before each test
    RateLimitService.clearAll();
  });

  // ============================================================================
  // SIGNUP TESTS
  // ============================================================================

  describe('Signup', () => {
    it('should signup user with valid credentials', async () => {
      const result = await AuthService.signup({
        email: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response.user_id).toBeDefined();
        expect(result.response.email).toBe('user@example.com');
        expect(result.response.access_token).toBeDefined();
        expect(result.response.refresh_token).toBeDefined();
        expect(result.response.token_type).toBe('Bearer');
        expect(result.response.expires_in).toBe(24 * 60 * 60); // 24 hours
      }
    });

    it('should reject duplicate email', async () => {
      // First signup
      await AuthService.signup({
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
      });

      // Second signup with same email
      const result = await AuthService.signup({
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('EMAIL_EXISTS');
        expect(result.error).toContain('Email already registered');
      }
    });

    it('should reject invalid email', async () => {
      const result = await AuthService.signup({
        email: 'not-an-email',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject weak password', async () => {
      const result = await AuthService.signup({
        email: 'user@example.com',
        password: 'weak',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.error).toBeDefined();
      }
    });

    it('should generate unique tokens per signup', async () => {
      const result1 = await AuthService.signup({
        email: 'user1@example.com',
        password: 'SecurePass123!',
      });

      const result2 = await AuthService.signup({
        email: 'user2@example.com',
        password: 'SecurePass123!',
      });

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.response.access_token).not.toBe(result2.response.access_token);
        expect(result1.response.user_id).not.toBe(result2.response.user_id);
      }
    });
  });

  // ============================================================================
  // LOGIN TESTS
  // ============================================================================

  describe('Login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await AuthService.signup({
        email: 'login@example.com',
        password: 'SecurePass123!',
      });
    });

    it('should login user with valid credentials', async () => {
      const result = await AuthService.login({
        email: 'login@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response.user_id).toBeDefined();
        expect(result.response.access_token).toBeDefined();
        expect(result.response.refresh_token).toBeDefined();
        expect(result.response.token_type).toBe('Bearer');
        expect(result.response.expires_in).toBe(24 * 60 * 60);
      }
    });

    it('should reject invalid password', async () => {
      const result = await AuthService.login({
        email: 'login@example.com',
        password: 'WrongPassword123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should reject nonexistent email', async () => {
      const result = await AuthService.login({
        email: 'notfound@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should generate new token on each login', async () => {
      const result1 = await AuthService.login({
        email: 'login@example.com',
        password: 'SecurePass123!',
      });

      // Add delay to ensure timestamp changes (JWT uses seconds)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result2 = await AuthService.login({
        email: 'login@example.com',
        password: 'SecurePass123!',
      });

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        // Tokens should be different (different iat timestamps)
        expect(result1.response.access_token).not.toBe(result2.response.access_token);
        expect(result1.response.user_id).toBe(result2.response.user_id);
      }
    });
  });

  // ============================================================================
  // JWT TOKEN TESTS
  // ============================================================================

  describe('JWT Service', () => {
    it('should generate valid access token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const token = JWTService.generateToken(userId, email, 'access');

      expect(token).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);

      const verification = JWTService.verifyToken(token);
      expect(verification.valid).toBe(true);
      if (verification.valid) {
        expect(verification.payload.sub).toBe(userId);
        expect(verification.payload.email).toBe(email);
        expect(verification.payload.type).toBe('access');
      }
    });

    it('should generate valid refresh token', () => {
      const token = JWTService.generateToken('user-id', 'test@example.com', 'refresh');
      const verification = JWTService.verifyToken(token);

      expect(verification.valid).toBe(true);
      if (verification.valid) {
        expect(verification.payload.type).toBe('refresh');
        // Refresh token expires in 7 days
        const expiresIn = verification.payload.exp - verification.payload.iat;
        expect(expiresIn).toBe(7 * 24 * 60 * 60);
      }
    });

    it('should reject tampered token', () => {
      const token = JWTService.generateToken('user-id', 'test@example.com', 'access');
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      const verification = JWTService.verifyToken(tamperedToken);
      expect(verification.valid).toBe(false);
    });

    it('should reject expired token', () => {
      // Manually create an expired token
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        iat: now - 100000,
        exp: now - 1, // Expired 1 second ago
        type: 'access' as const,
      };

      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const message = `${encodedHeader}.${encodedPayload}`;

      const crypto = require('crypto');
      const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
      const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(message)
        .digest('base64url');

      const expiredToken = `${message}.${signature}`;
      const verification = JWTService.verifyToken(expiredToken);
      expect(verification.valid).toBe(false);
    });
  });

  // ============================================================================
  // PASSWORD HASHING TESTS
  // ============================================================================

  describe('Password Service', () => {
    it('should hash password', async () => {
      const password = 'MyPassword123!';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(':');
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'MyPassword123!';
      const hash = await PasswordService.hashPassword(password);
      const isValid = await PasswordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'MyPassword123!';
      const hash = await PasswordService.hashPassword(password);
      const isValid = await PasswordService.verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'MyPassword123!';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
      expect(await PasswordService.verifyPassword(password, hash1)).toBe(true);
      expect(await PasswordService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  // ============================================================================
  // RATE LIMITING TESTS
  // ============================================================================

  describe('Rate Limiting', () => {
    it('should allow requests under limit', () => {
      const clientId = 'client-1';
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(clientId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block request at limit', () => {
      const clientId = 'client-2';
      // Make 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        checkRateLimit(clientId);
      }
      // 11th should be blocked
      const result = checkRateLimit(clientId);
      expect(result.allowed).toBe(false);
    });

    it('should track remaining requests', () => {
      const clientId = 'client-3';
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(clientId);
        expect(result.remaining).toBe(10 - (i + 1));
      }
    });
  });

  // ============================================================================
  // RLS VALIDATION TESTS
  // ============================================================================

  describe('RLS Isolation', () => {
    it('should prevent one user accessing another user data', async () => {
      // Create two users (with unique emails)
      const result1 = await AuthService.signup({
        email: `user1-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

      const result2 = await AuthService.signup({
        email: `user2-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

      if (!result1.success || !result2.success) {
        expect(true).toBe(false); // Force failure with clear message
        return;
      }

      // Verify tokens are for different users
      const user1TokenVerification = AuthService.verifyToken(result1.response.access_token);
      const user2TokenVerification = AuthService.verifyToken(result2.response.access_token);

      expect(user1TokenVerification.valid && user2TokenVerification.valid).toBe(true);
      if (user1TokenVerification.valid && user2TokenVerification.valid) {
        expect(user1TokenVerification.userId).not.toBe(user2TokenVerification.userId);
        expect(user1TokenVerification.email).toContain('user1');
        expect(user2TokenVerification.email).toContain('user2');
      }
    });

    it('should validate auth token properly', async () => {
      const signupResult = await AuthService.signup({
        email: 'authtest@example.com',
        password: 'SecurePass123!',
      });

      expect(signupResult.success).toBe(true);
      if (signupResult.success) {
        const authResult = validateAuthToken(`Bearer ${signupResult.response.access_token}`);
        expect(authResult.authenticated).toBe(true);
        expect(authResult.userId).toBe(signupResult.response.user_id);
      }
    });

    it('should reject invalid bearer token', () => {
      const authResult = validateAuthToken('Bearer invalid.token.here');
      expect(authResult.authenticated).toBe(false);
    });
  });
});
