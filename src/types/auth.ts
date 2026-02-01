/**
 * Authentication Types
 * Strict TypeScript auth domain models
 */

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: string;
  email?: string;
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface RLSContext {
  user_id: string;
  role: 'authenticated' | 'anon';
}

export interface SignupError {
  code: string;
  message: string;
}

export type TokenType = 'access' | 'refresh';
