/**
 * API Route: POST /api/admin/review/:questionId
 * US-1B.5: Expert Review Queue - Decision Endpoint
 *
 * Allows expert reviewers to approve/reject/request revisions
 * Updates reputation score and marks questions as reviewed
 */

import { z } from 'zod';

/**
 * Review decision input
 */
const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'request_revision', 'reject']),
  notes: z.string().optional(),
});

export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

/**
 * Reputation score mapping
 * - Pending (new AI-generated): 0/10
 * - Approved: 7/10 (released to students)
 * - Request revision: 3/10 (awaiting fixes)
 * - Rejected: -1/10 (never shown)
 */
const REPUTATION_SCORES = {
  pending: 0,
  approved: 7,
  revision_requested: 3,
  rejected: -1,
};

/**
 * POST /api/admin/review/:questionId
 *
 * Decision data:
 * {
 *   decision: 'approve' | 'request_revision' | 'reject',
 *   notes: string (required if decision != 'approve')
 * }
 *
 * Updates:
 * - question_sources.approved_at = NOW()
 * - question_sources.approved_by = reviewer_id
 * - question_reputation.current_score = [7, 3, -1]
 * - Sends notification to question generator
 */
export async function reviewDecisionHandler(req: any, res: any) {
  // Authorization
  const userRole = req.user?.role;
  if (!['admin', 'expert_reviewer'].includes(userRole)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { questionId } = req.query;
  const reviewerId = req.user?.id;

  // Validate input
  const decision = reviewDecisionSchema.safeParse(req.body);
  if (!decision.success) {
    return res.status(400).json({ error: 'Invalid request body', details: decision.error });
  }

  // Validate notes if required
  if (decision.data.decision !== 'approve' && !decision.data.notes) {
    return res.status(400).json({
      error: 'Review notes required for request_revision and reject decisions',
    });
  }

  try {
    // Step 1: Verify question exists and is pending review
    // SELECT * FROM question_sources
    // WHERE question_id = $1 AND source_type = 'ai_generated' AND approved_at IS NULL

    // TODO: Execute query

    // Step 2: Update question_sources with review decision
    // UPDATE question_sources SET
    //   approved_at = NOW(),
    //   approved_by = $1,
    //   review_notes = $2
    // WHERE question_id = $3

    const reputationScore =
      decision.data.decision === 'approve'
        ? REPUTATION_SCORES.approved
        : decision.data.decision === 'request_revision'
          ? REPUTATION_SCORES.revision_requested
          : REPUTATION_SCORES.rejected;

    // Step 3: Update question_reputation score
    // UPDATE question_reputation SET
    //   current_score = $1,
    //   status = CASE
    //     WHEN $2 = 'approved' THEN 'active'
    //     WHEN $2 = 'rejected' THEN 'disabled'
    //     ELSE 'under_review'
    //   END,
    //   last_updated = NOW()
    // WHERE question_id = $3

    // Step 4: Log to audit_log for compliance
    // INSERT INTO audit_log (table_name, operation, record_id, new_value, changed_by)
    // VALUES ('question_sources', 'UPDATE', $1, row_to_json(...), $2)

    // Step 5: Send notifications
    await sendReviewNotification({
      question_id: questionId,
      decision: decision.data.decision,
      reviewer_id: reviewerId,
      notes: decision.data.notes,
    });

    const response = {
      question_id: questionId,
      decision: decision.data.decision,
      reputation_score: reputationScore,
      approved_by: reviewerId,
      approved_at: new Date(),
      message: `Question ${decision.data.decision} by expert review`,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing review decision:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Send notification to question generator on review completion
 */
async function sendReviewNotification(data: {
  question_id: string;
  decision: string;
  reviewer_id: string;
  notes?: string;
}) {
  // TODO: Send email to generator
  // TODO: Send Slack notification if in team workspace
  // TODO: Create in-app notification

  console.log('Review notification:', data);
}

export default reviewDecisionHandler;
