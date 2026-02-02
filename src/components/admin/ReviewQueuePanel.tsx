/**
 * ReviewQueuePanel Component
 * Displays pending questions for review with approve/reject actions
 * Integrates with the existing review queue API endpoint
 * Part of the Admin Dashboard
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ReviewQueueItem } from '@/src/services/admin/review.service';

interface ReviewQueuePanelProps {
  items: ReviewQueueItem[];
  isLoading?: boolean;
  onApprove?: (questionId: string) => Promise<void>;
  onReject?: (questionId: string, notes: string) => Promise<void>;
}

export const ReviewQueuePanel: React.FC<ReviewQueuePanelProps> = ({
  items = [],
  isLoading = false,
  onApprove,
  onReject,
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (questionId: string) => {
    setProcessingId(questionId);
    try {
      await onApprove?.(questionId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (questionId: string) => {
    setProcessingId(questionId);
    try {
      await onReject?.(questionId, rejectNotes);
      setRejectNotes('');
      setActiveQuestionId(null);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-white dark:bg-gray-800 p-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 p-6">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">Review Queue</h3>
        <Badge variant="primary" label={`${items.length} pending`} />
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
          <p>No questions pending review</p>
        </div>
      ) : (
        /* Review Items */
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.question_id}
              className="border rounded p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            >
              {/* Question Text */}
              <p className="text-sm font-medium mb-2 dark:text-white truncate">
                {item.question_text}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <AlertCircle size={14} />
                  {item.report_count} report{item.report_count !== 1 ? 's' : ''}
                </span>
                <span>Score: {item.reputation_score}/10</span>
              </div>

              {/* Feedback Types */}
              {item.feedback && item.feedback.length > 0 && (
                <div className="mb-3 flex gap-1 flex-wrap">
                  {item.feedback.map((feedback, idx) => (
                    <Badge key={idx} variant="secondary" label={feedback} />
                  ))}
                </div>
              )}

              {/* Expanded View - Notes Input */}
              {activeQuestionId === item.question_id && (
                <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
                  <label className="block text-xs font-medium mb-2 dark:text-gray-300">
                    Rejection Notes (optional):
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Explain why this question is being rejected..."
                    className="w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none h-20"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleApprove(item.question_id)}
                  disabled={processingId === item.question_id}
                  className="flex-1 text-xs"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Approve
                </Button>

                {activeQuestionId === item.question_id ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(item.question_id, rejectNotes)}
                      disabled={processingId === item.question_id}
                      className="flex-1 text-xs"
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveQuestionId(null);
                        setRejectNotes('');
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setActiveQuestionId(item.question_id)}
                    disabled={processingId === item.question_id}
                    className="flex-1 text-xs"
                  >
                    <XCircle size={14} className="mr-1" />
                    Reject
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewQueuePanel;
