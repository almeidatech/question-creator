import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/middleware/auth.middleware';
import { BatchProcessorService } from '@/services/import/batch-processor.service';

/**
 * POST /api/admin/import/[id]/rollback
 * Rollback an import job - deletes all imported questions and resets status
 *
 * Response 200:
 * {
 *   import_id: string,
 *   status: "rollback",
 *   deleted_count: number,
 *   message: string
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    // Perform rollback
    const result = await BatchProcessorService.rollbackImport(importId);

    return res.status(200).json({
      import_id: importId,
      status: 'rollback',
      deleted_count: result.deletedCount,
      message: `Rollback completed. Deleted ${result.deletedCount} imported questions.`,
    });
  } catch (error) {
    console.error('Import rollback API error:', error);

    if (error instanceof Error && error.message.includes('Import not found')) {
      return res.status(404).json({ error: 'Import not found' });
    }

    if (error instanceof Error && error.message.includes('already rolled back')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Failed to rollback import',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
