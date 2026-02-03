import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/middleware/auth.middleware';
import { BatchProcessorService } from '@/services/import/batch-processor.service';

/**
 * GET /api/admin/import/[id]/progress
 * Get current progress of an import job
 *
 * Response 200:
 * {
 *   import_id: string,
 *   status: "in_progress" | "completed" | "failed",
 *   processed: number,
 *   total: number,
 *   progress_percent: number,
 *   successful: number,
 *   failed: number,
 *   estimated_remaining_minutes: number
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: importId } = req.query;

    if (!importId || typeof importId !== 'string') {
      return res.status(400).json({ error: 'Invalid import ID' });
    }

    // Get progress
    const progress = await BatchProcessorService.getProgress(importId);

    return res.status(200).json(progress);
  } catch (error) {
    console.error('Import progress API error:', error);

    if (error instanceof Error && error.message.includes('Import not found')) {
      return res.status(404).json({ error: 'Import not found' });
    }

    return res.status(500).json({
      error: 'Failed to fetch import progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
