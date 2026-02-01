/**
 * Rate Limiting Service
 * In-memory store for MVP (would use Redis in production)
 */

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * Production should use Upstash Redis or similar
 */
export class RateLimitService {
  private static readonly store = new Map<string, RateLimitEntry>();
  private static readonly WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly MAX_ATTEMPTS = 10; // 10 requests per minute

  /**
   * Check if request should be rate limited
   */
  static isRateLimited(key: string): { limited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or window expired, reset
    if (!entry || now > entry.resetTime) {
      this.store.set(key, { attempts: 1, resetTime: now + this.WINDOW_MS });
      return { limited: false, remaining: this.MAX_ATTEMPTS - 1, resetTime: now + this.WINDOW_MS };
    }

    // Increment attempts
    entry.attempts++;

    // Check limit
    const remaining = Math.max(0, this.MAX_ATTEMPTS - entry.attempts);
    const limited = entry.attempts > this.MAX_ATTEMPTS;

    return { limited, remaining, resetTime: entry.resetTime };
  }

  /**
   * Get current rate limit status
   */
  static getStatus(key: string): { remaining: number; resetTime: number; limited: boolean } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      return { remaining: this.MAX_ATTEMPTS, resetTime: now + this.WINDOW_MS, limited: false };
    }

    const remaining = Math.max(0, this.MAX_ATTEMPTS - entry.attempts);
    return { remaining, resetTime: entry.resetTime, limited: remaining === 0 };
  }

  /**
   * Reset rate limit for key
   */
  static reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries (useful for testing)
   */
  static clearAll(): void {
    this.store.clear();
  }
}
