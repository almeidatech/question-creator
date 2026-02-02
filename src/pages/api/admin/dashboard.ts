/**
 * API Endpoint: GET /api/admin/dashboard
 * US-3.2: Admin Dashboard & Review Queue
 *
 * Returns aggregated system statistics for the admin dashboard
 * Includes caching with 5-minute TTL for performance
 * Admin only endpoint with JWT authentication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/src/middleware/auth.middleware';
import { verifyAdminAccess } from '@/src/services/admin/review.service';
import {
  getDashboardStats,
  DashboardStats,
} from '@/src/services/admin/dashboard.service';
import {
  getCachedStats,
  setCachedStats,
  invalidateCache,
  getCacheMetadata,
} from '@/src/services/admin/cache.service';

interface DashboardResponse {
  stats: DashboardStats;
  cache: {
    cached: boolean;
    ttl_remaining_seconds: number | null;
    expires_at: string | null;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Handler for GET /api/admin/dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | ErrorResponse>
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Step 1: Verify authentication
    const userId = verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - missing or invalid token' });
    }

    // Step 2: Verify admin access
    const isAdmin = await verifyAdminAccess(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    // Step 3: Check query parameters
    const refresh = req.query.refresh === 'true';

    // Step 4: Check cache (unless refresh requested)
    let stats: DashboardStats | null = null;

    if (!refresh) {
      stats = await getCachedStats();
      if (stats) {
        // Cache hit - return immediately
        const metadata = await getCacheMetadata();
        return res.status(200).json({
          stats,
          cache: {
            cached: true,
            ttl_remaining_seconds: metadata?.ttl_seconds || null,
            expires_at: metadata?.cached_at
              ? new Date(
                  new Date(metadata.cached_at).getTime() + 5 * 60 * 1000
                ).toISOString()
              : null,
          },
        });
      }
    } else {
      // Force refresh requested - invalidate cache first
      await invalidateCache();
    }

    // Step 5: Cache miss or refresh requested - get fresh stats
    stats = await getDashboardStats();

    if (!stats) {
      return res.status(500).json({
        error: 'Failed to fetch dashboard statistics',
        details: 'Unable to aggregate stats from database',
      });
    }

    // Step 6: Cache the result for 5 minutes
    await setCachedStats(stats);

    // Step 7: Return stats with cache metadata
    const metadata = await getCacheMetadata();
    return res.status(200).json({
      stats,
      cache: {
        cached: true,
        ttl_remaining_seconds: metadata?.ttl_seconds || 300,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
