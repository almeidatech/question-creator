/**
 * JWT Token Generation & Validation Service
 * Handles token creation and validation with strict typing
 */

import { JWTPayload, TokenType } from '@/types/auth';

// Configuration constants
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Simple JWT implementation (for MVP - production should use jsonwebtoken)
 * Creates a base64-encoded JWT with header.payload.signature
 */
export class JWTService {
  /**
   * Generate JWT token
   */
  static generateToken(
    userId: string,
    email: string,
    type: TokenType = 'access'
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = type === 'access'
      ? now + ACCESS_TOKEN_EXPIRY
      : now + REFRESH_TOKEN_EXPIRY;

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload: JWTPayload = {
      sub: userId,
      email,
      iat: now,
      exp: expiry,
      type,
    };

    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Create signature
    const message = `${encodedHeader}.${encodedPayload}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(message)
      .digest('base64url');

    return `${message}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { valid: true; payload: JWTPayload } | { valid: false; error: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const message = `${encodedHeader}.${encodedPayload}`;
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(message)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid token signature' };
      }

      // Decode payload
      const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      const payload: JWTPayload = JSON.parse(payloadJson);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: `Token verification failed: ${message}` };
    }
  }

  /**
   * Get expiration time in seconds from now
   */
  static getExpiresIn(type: TokenType = 'access'): number {
    return type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  }
}

