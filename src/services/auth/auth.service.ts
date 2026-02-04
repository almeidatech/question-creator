/**
 * Authentication Service
 * Core business logic for signup/login
 */

import { AuthResponse, SignupRequest, LoginRequest } from '@/types/auth';

import { validateSignup, validateLogin } from '@/utils/validation';
import { getSupabaseClient, getSupabaseServiceClient } from '@/services/database/supabase-client';

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
    const supabase = getSupabaseClient();
    const serviceClient = getSupabaseServiceClient();

    try {
      // 1. Create user in Supabase Auth
      console.log('[AuthService] Starting signup for:', email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('[AuthService] Auth signup error:', authError);
        // Map Supabase errors
        if (authError.message.includes('already registered')) {
          return { success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' };
        }
        return { success: false, error: authError.message, code: 'SIGNUP_ERROR' };
      }

      if (!authData.user) {
        console.error('[AuthService] No user returned from signup');
        return { success: false, error: 'Signup failed to create user', code: 'SIGNUP_ERROR' };
      }

      const userId = authData.user.id;
      console.log('[AuthService] User created in auth.users:', userId);

      // 2. Create user profile in public.users
      // Always create this, even if email verification is required (no session yet)
      console.log('[AuthService] Creating user profile in public.users...');
      const { data: profileData, error: profileError } = await serviceClient
        .from('users')
        .insert({
          id: userId,
          email: email,
          user_role: 'student', // Default role
          subscription_tier: 'free', // Default tier
          is_active: true,
        })
        .select();

      if (profileError) {
        console.error('[AuthService] Failed to create public user profile:', profileError);
        console.error('[AuthService] Profile error details:', JSON.stringify(profileError, null, 2));
        // Optional: rollback auth user creation if strict consistency is needed
        // await serviceClient.auth.admin.deleteUser(userId);
        return { success: false, error: `Failed to create user profile: ${profileError.message}`, code: 'PROFILE_ERROR' };
      }

      console.log('[AuthService] User profile created successfully:', profileData);

      // 3. Return session or verification requirement
      if (!authData.session) {
        // Email confirmation is enabled and required
        return { success: false, error: 'Please verify your email address before logging in', code: 'EMAIL_VERIFICATION_REQUIRED' };
      }

      return {
        success: true,
        response: {
          user_id: userId,
          email,
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          token_type: 'Bearer',
          expires_in: authData.session.expires_in,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Signup exception:', error);
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
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message, code: 'INVALID_CREDENTIALS' };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'Login failed', code: 'LOGIN_ERROR' };
      }

      return {
        success: true,
        response: {
          user_id: data.user.id,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          token_type: 'Bearer',
          expires_in: data.session.expires_in,
        },
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Login failed: ${message}`, code: 'LOGIN_ERROR' };
    }
  }

  /**
   * Verify token and extract user_id
   * Now ASYNC as it checks against Supabase
   */
  static async verifyToken(token: string): Promise<{ valid: true; userId: string; email: string } | { valid: false; error: string }> {
    const supabase = getSupabaseClient();

    try {
      console.log('[AuthService.verifyToken] Verifying token...');
      // Verify token by getting the user
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('[AuthService.verifyToken] Token verification failed:', error?.message || 'No user');
        return { valid: false, error: error?.message || 'Invalid token' };
      }

      console.log('[AuthService.verifyToken] Token valid for user:', user.id);
      return {
        valid: true,
        userId: user.id,
        email: user.email || '',
      };
    } catch (error) {
      console.error('[AuthService.verifyToken] Exception:', error);
      return { valid: false, error: 'Token verification failed' };
    }
  }
}

