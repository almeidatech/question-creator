/**
 * Password Hashing Service
 * Uses crypto for bcrypt-like hashing (bcrypt package would be used in production)
 */

const ROUNDS = 12; // bcrypt rounds, minimum 12 for security

/**
 * Simple password hashing using PBKDF2
 * In production, use bcryptjs or bcrypt package
 */
export class PasswordService {
  /**
   * Hash password (uses PBKDF2 for MVP)
   * Production should use bcryptjs: bcryptjs.hash(password, 12)
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const crypto = require('crypto');

      // Generate random salt
      const salt = crypto.randomBytes(16).toString('hex');

      // Hash password with PBKDF2
      const hash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
        .toString('hex');

      // Return salt:hash format
      return `${salt}:${hash}`;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const [salt, originalHash] = hash.split(':');

      if (!salt || !originalHash) {
        return false;
      }

      // Hash the provided password with the same salt
      const computedHash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
        .toString('hex');

      // Compare hashes (timing-safe comparison)
      return crypto.timingSafeEqual(
        Buffer.from(computedHash),
        Buffer.from(originalHash)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { strong: boolean; reason?: string } {
    if (password.length < 8) {
      return { strong: false, reason: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { strong: false, reason: 'Password must contain uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { strong: false, reason: 'Password must contain number' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { strong: false, reason: 'Password must contain special character' };
    }
    return { strong: true };
  }
}

