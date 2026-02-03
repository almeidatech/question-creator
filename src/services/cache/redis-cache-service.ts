/**
 * Redis Cache Service for Question Generation Results
 * US-1B.4: Redis Cache Strategy
 *
 * Caches generated question lists for 24 hours to reduce API costs
 * Target: >70% cache hit rate by end of Week 8
 */

import { Redis } from '@upstash/redis';

/**
 * Cache hit/miss tracking
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number; // 0-1
  timestamp: Date;
}

/**
 * Cache statistics tracked per interval
 */
export interface CacheStats {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  average_hit_latency_ms: number;
  average_miss_latency_ms: number;
  memory_usage_bytes: number;
  last_updated: Date;
}

// Singleton Redis instance
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 * Uses Upstash Redis (already in stack per project brief)
 */
export function initializeRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error('REDIS_URL and REDIS_TOKEN not configured');
  }

  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  return redisClient;
}

/**
 * Generate cache key for question generation results
 *
 * Format: question:gen:${userId}:${topic}:${difficulty}:${count}
 * Example: question:gen:abc-123:direitos-fundamentais:medium:10
 */
export function generateCacheKey(
  userId: string,
  topic: string,
  difficulty: string,
  count: number
): string {
  // Normalize topic to slug format
  const topicSlug = topic
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return `question:gen:${userId}:${topicSlug}:${difficulty}:${count}`;
}

/**
 * Get cached questions if available
 *
 * Returns null if:
 * - Cache miss
 * - Key not found
 * - Redis unavailable (fallback to direct API call)
 */
export async function getCachedQuestions(
  userId: string,
  topic: string,
  difficulty: string,
  count: number
): Promise<any[] | null> {
  const redis = initializeRedis();
  const cacheKey = generateCacheKey(userId, topic, difficulty, count);

  try {
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Log cache hit
    await logCacheEvent({
      event: 'cache_hit',
      key: cacheKey,
      user_id: userId,
      timestamp: new Date(),
    });

    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as any[];
  } catch (error) {
    // Log error but don't fail - fall through to API call
    console.error('Redis cache get error:', error);
    return null;
  }
}

/**
 * Store generated questions in cache
 *
 * TTL: 86400 seconds (24 hours)
 * Only cache Gemini-generated questions, NOT fallback real questions
 */
export async function cacheGeneratedQuestions(
  userId: string,
  topic: string,
  difficulty: string,
  count: number,
  questions: any[],
  isFallback: boolean = false
): Promise<void> {
  // Don't cache fallback real questions
  if (isFallback) {
    return;
  }

  const redis = initializeRedis();
  const cacheKey = generateCacheKey(userId, topic, difficulty, count);
  const ttlSeconds = 24 * 60 * 60; // 24 hours

  try {
    // Store as JSON string
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(questions));

    // Log cache write
    await logCacheEvent({
      event: 'cache_write',
      key: cacheKey,
      user_id: userId,
      ttl_seconds: ttlSeconds,
      size_bytes: JSON.stringify(questions).length,
      timestamp: new Date(),
    });
  } catch (error) {
    // Log but don't fail - if cache unavailable, just skip caching
    console.error('Redis cache set error:', error);
  }
}

/**
 * Invalidate cache for specific user
 * Admin endpoint for cache management
 */
export async function invalidateCacheKey(cacheKey: string): Promise<void> {
  const redis = initializeRedis();

  try {
    await redis.del(cacheKey);

    await logCacheEvent({
      event: 'cache_invalidate',
      key: cacheKey,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Redis cache invalidation error:', error);
  }
}

/**
 * Invalidate all cache for a user
 * Pattern: question:gen:${userId}:*
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  const redis = initializeRedis();
  const pattern = `question:gen:${userId}:*`;

  try {
    // SCAN-based deletion (Redis doesn't support wildcard DEL)
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      }) as [string, string[]];

      cursor = result[0];
      const keys = result[1] || [];

      if (keys.length > 0) {
        deletedCount += keys.length;
        await Promise.all(keys.map((key) => redis.del(key as string)));
      }
    } while (cursor !== '0');

    await logCacheEvent({
      event: 'user_cache_invalidate',
      user_id: userId,
      keys_deleted: deletedCount,
      timestamp: new Date(),
    });

    return deletedCount;
  } catch (error) {
    console.error('Redis user cache invalidation error:', error);
    return 0;
  }
}

/**
 * Get cache statistics for monitoring dashboard
 */
export async function getCacheStatistics(): Promise<CacheStats> {
  const redis = initializeRedis();

  try {
    // Get INFO stats from Redis
    const info = {}; // await redis.info(); - info() not available on Upstash Redis HTTP client

    // Parse relevant fields (implementation depends on Redis client)
    const stats: CacheStats = {
      total_requests: 0, // Would come from application-level tracking
      cache_hits: 0,
      cache_misses: 0,
      hit_rate: 0,
      average_hit_latency_ms: 0,
      average_miss_latency_ms: 0,
      memory_usage_bytes: 0,
      last_updated: new Date(),
    };

    return stats;
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    throw error;
  }
}

/**
 * Log cache events for monitoring and metrics
 * Used to calculate hit rate, identify issues
 */
async function logCacheEvent(data: {
  event: 'cache_hit' | 'cache_miss' | 'cache_write' | 'cache_invalidate' | 'user_cache_invalidate';
  key?: string;
  user_id?: string;
  ttl_seconds?: number;
  size_bytes?: number;
  keys_deleted?: number;
  timestamp: Date;
}): Promise<void> {
  // Log to application monitoring
  console.log(
    JSON.stringify({
      log_type: 'cache_event',
      ...data,
    })
  );

  // TODO: Send to Datadog/Sentry for dashboard metrics
  // TODO: Track cache_hit_rate = hits / (hits + misses)
  // TODO: Alert if hit_rate drops below 60%
}

/**
 * Health check: verify Redis connectivity
 */
export async function checkRedisHealth(): Promise<boolean> {
  const redis = initializeRedis();

  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Middleware for caching question generation requests
 * Usage: Apply before calling Gemini API
 */
export async function withCaching<T>(
  userId: string,
  topic: string,
  difficulty: string,
  count: number,
  generateFn: () => Promise<T>,
  isFallback: boolean = false
): Promise<T> {
  // Try cache first
  const cached = await getCachedQuestions(userId, topic, difficulty, count);
  if (cached) {
    return cached as T;
  }

  // Cache miss - call generation function
  const result = await generateFn();

  // Store in cache for next time
  await cacheGeneratedQuestions(userId, topic, difficulty, count, result as any[], isFallback);

  return result;
}

/**
 * Schema validation for cached data
 */
import { z } from 'zod';

export const cachedQuestionsSchema = z.array(
  z.object({
    text: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.number().min(0).max(3),
    explanation: z.string().optional(),
  })
);

export type CachedQuestions = z.infer<typeof cachedQuestionsSchema>;

