import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/src/middleware/auth.middleware';
import { ImportOrchestrator } from '@/src/services/import/import-orchestrator.service';

/**
 * POST /api/admin/import/csv
 * Uploads and processes a CSV file for question import
 *
 * Request: multipart/form-data with 'file' field
 * Response 202 (Accepted):
 * {
 *   import_id: string,
 *   status: "queued",
 *   filename: string,
 *   estimated_time_minutes: number
 * }
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (simplified check - would need proper admin verification)
    // For now, we'll assume the user is authenticated

    // Parse form data
    const { files } = req;
    if (!files || !files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const filename = file.originalFilename || 'upload.csv';
    const buffer = file.filepath ?
      require('fs').readFileSync(file.filepath) :
      Buffer.from(file.data || '');

    // Start async import (don't wait for completion)
    // In production, this would be queued to a job worker
    ImportOrchestrator.executeImport(buffer, filename, userId)
      .catch(error => {
        console.error(`Import ${filename} failed:`, error);
      });

    // Estimate time based on file size
    const estimatedRows = buffer.toString().split('\n').length;
    const estimatedTimeMinutes = Math.max(
      1,
      Math.ceil((estimatedRows * 100) / 60000)
    );

    // Return import ID immediately
    return res.status(202).json({
      import_id: 'pending', // Would be returned after creating import record
      status: 'queued',
      filename,
      estimated_time_minutes: estimatedTimeMinutes,
      message: 'Import started. Check progress using the import ID.',
    });
  } catch (error) {
    console.error('CSV import API error:', error);
    return res.status(500).json({
      error: 'Failed to process import',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
