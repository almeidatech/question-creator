/**
 * Admin Cache Service
 * Handles 5-minute caching for admin dashboard statistics
 * Uses Redis to store and retrieve cached dashboard data
 *
 * Specification: US-3.2 Admin Dashboard & Review Queue
 */

import { Redis } from '@upstash/redis';
import { DashboardStats } from './dashboard.service';

// Cache configuration
const CACHE_KEY = 'admin:dashboard:stats';
const TTL_SECONDS = 300; // 5 minutes as per story requirement

// Initialize Redis client (reuse existing configuration)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Check if Redis is configured and available
 */
function isRedisAvailable(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Get cached dashboard statistics
 * Returns null if cache miss or Redis unavailable
 */
export async function getCachedStats(): Promise<DashboardStats | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const cached = await redis.get<DashboardStats>(CACHE_KEY);
    return cached || null;
  } catch (err) {
    console.error('Error retrieving cache:', err);
    return null;
  }
}

/**
 * Store dashboard statistics in cache with 5-minute TTL
 */
export async function setCachedStats(stats: DashboardStats): Promise<void> {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redis.setex(CACHE_KEY, TTL_SECONDS, JSON.stringify(stats));
  } catch (err) {
    console.error('Error setting cache:', err);
    // Fail silently - cache is optional, service should continue
  }
}

/**
 * Invalidate cache by deleting the cache key
 * Called when data is mutated (imports complete, reviews submitted)
 */
export async function invalidateCache(): Promise<void> {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redis.del(CACHE_KEY);
  } catch (err) {
    console.error('Error invalidating cache:', err);
    // Fail silently - cache is optional
  }
}

/**
 * Get cache metadata (TTL remaining)
 * Useful for debugging and monitoring
 */
export async function getCacheMetadata(): Promise<{
  cached: boolean;
  ttl_seconds: number | null;
  cached_at: string | null;
} | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const cached = await redis.exists(CACHE_KEY);
    const ttl = await redis.ttl(CACHE_KEY);

    if (!cached) {
      return {
        cached: false,
        ttl_seconds: null,
        cached_at: null,
      };
    }

    return {
      cached: true,
      ttl_seconds: ttl,
      cached_at: new Date(Date.now() - (TTL_SECONDS - ttl) * 1000).toISOString(),
    };
  } catch (err) {
    console.error('Error getting cache metadata:', err);
    return null;
  }
}

/**
 * Check if cache has expired or is missing
 */
export async function isCacheExpired(): Promise<boolean> {
  if (!isRedisAvailable()) {
    return true;
  }

  try {
    const exists = await redis.exists(CACHE_KEY);
    return !exists;
  } catch (err) {
    console.error('Error checking cache expiration:', err);
    return true; // Treat errors as cache miss
  }
}
