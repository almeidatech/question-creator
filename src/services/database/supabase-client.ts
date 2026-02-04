/**
 * Supabase Client with Advisory Locks
 * Provides safe concurrent access for critical operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize and return Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Get service role client (for backend operations)
 */
export function getSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Acquire advisory lock for race condition prevention
 * Lock ID should be unique per resource (e.g., question ID hash)
 */
export async function acquireAdvisoryLock(
  lockId: number,
  timeoutMs: number = 5000
): Promise<boolean> {
  const client = getSupabaseServiceClient();

  try {
    // Use pg_advisory_lock with timeout
    const { error } = await client.rpc('pg_advisory_lock', {
      lockid: lockId,
    });

    if (error) {
      console.error('Advisory lock acquisition failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Advisory lock error:', err);
    return false;
  }
}

/**
 * Release advisory lock
 */
export async function releaseAdvisoryLock(lockId: number): Promise<boolean> {
  const client = getSupabaseServiceClient();

  try {
    const { error } = await client.rpc('pg_advisory_unlock', {
      lockid: lockId,
    });

    if (error) {
      console.error('Advisory lock release failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Advisory unlock error:', err);
    return false;
  }
}

/**
 * Execute operation with advisory lock for race condition safety
 */
export async function withAdvisoryLock<T>(
  lockId: number,
  operation: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T | null> {
  const acquired = await acquireAdvisoryLock(lockId, timeoutMs);

  if (!acquired) {
    throw new Error(`Failed to acquire advisory lock ${lockId}`);
  }

  try {
    return await operation();
  } finally {
    await releaseAdvisoryLock(lockId);
  }
}

/**
 * Hash a UUID string to number for advisory lock ID
 */
export function hashUuidToLockId(uuid: string): number {
  // PostgreSQL advisory locks use 64-bit integers
  // We'll convert UUID to a deterministic 32-bit integer
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get current user ID from JWT token
 */
export async function getCurrentUserId(authHeader?: string): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

