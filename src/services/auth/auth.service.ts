/**
 * Authentication Service
 * Core business logic for signup/login
 */

import { AuthResponse, SignupRequest, LoginRequest } from '@/src/types/auth';
import { JWTService } from './jwt.service';
import { PasswordService } from './password.service';
import { validateSignup, validateLogin } from '@/src/utils/validation';

/**
 * In-memory user store (replace with Supabase in production)
 */
interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

const users = new Map<string, StoredUser>();

/**
 * Main Auth Service
 */
export class AuthService {
  /**
   * Signup user
   */
  static async signup(request: SignupRequest): Promise<{ success: true; response: AuthResponse } | { success: false; error: string; code: string }> {
    // Validate input
    const validation = validateSignup(request);
    if (!validation.valid) {
      return { success: false, error: validation.error, code: 'VALIDATION_ERROR' };
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' };
    }

    try {
      // Hash password
      const passwordHash = await PasswordService.hashPassword(password);

      // Create user
      const userId = this.generateUUID();
      const user: StoredUser = {
        id: userId,
        email,
        password_hash: passwordHash,
        created_at: new Date(),
      };

      users.set(userId, user);

      // Generate tokens
      const access_token = JWTService.generateToken(userId, email, 'access');
      const refresh_token = JWTService.generateToken(userId, email, 'refresh');

      return {
        success: true,
        response: {
          user_id: userId,
          email,
          access_token,
          refresh_token,
          token_type: 'Bearer',
          expires_in: JWTService.getExpiresIn('access'),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Signup failed: ${message}`, code: 'SIGNUP_ERROR' };
    }
  }

  /**
   * Login user
   */
  static async login(request: LoginRequest): Promise<{ success: true; response: AuthResponse } | { success: false; error: string; code: string }> {
    // Validate input
    const validation = validateLogin(request);
    if (!validation.valid) {
      return { success: false, error: validation.error, code: 'VALIDATION_ERROR' };
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
    }

    try {
      // Verify password
      const passwordMatch = await PasswordService.verifyPassword(password, user.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
      }

      // Generate tokens
      const access_token = JWTService.generateToken(user.id, user.email, 'access');
      const refresh_token = JWTService.generateToken(user.id, user.email, 'refresh');

      return {
        success: true,
        response: {
          user_id: user.id,
          access_token,
          refresh_token,
          token_type: 'Bearer',
          expires_in: JWTService.getExpiresIn('access'),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Login failed: ${message}`, code: 'LOGIN_ERROR' };
    }
  }

  /**
   * Verify token and extract user_id
   */
  static verifyToken(token: string): { valid: true; userId: string; email: string } | { valid: false; error: string } {
    const verification = JWTService.verifyToken(token);
    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    return {
      valid: true,
      userId: verification.payload.sub,
      email: verification.payload.email,
    };
  }

  /**
   * Generate UUID v4
   */
  private static generateUUID(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }
}
