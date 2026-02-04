/**
 * Admin Dashboard Page
 * Main admin control center displaying system stats, imports, and review queue
 * US-3.2: Admin Dashboard & Review Queue
 *
 * Features:
 * - System metrics cards
 * - Import history table with filtering
 * - Review queue with approve/reject actions
 * - Real-time refresh capability
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18nContext';
import { useAuthStore } from '@/stores';
import { SystemMetrics } from '@/components/admin/SystemMetrics';
import { ImportHistory } from '@/components/admin/ImportHistory';
import { ReviewQueuePanel } from '@/components/admin/ReviewQueuePanel';
import { DashboardStats } from '@/services/admin/dashboard.service';
import { ReviewQueueItem, processReviewDecision } from '@/services/admin/review.service';
import { RefreshCw } from 'lucide-react';

interface DashboardState {
  stats: DashboardStats | null;
  reviewQueue: ReviewQueueItem[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useI18n();
  const { token } = useAuthStore();
  const [state, setState] = useState<DashboardState>({
    stats: null,
    reviewQueue: [],
    loading: true,
    error: null,
    lastRefresh: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (!token) {
      console.error('[AdminDashboard] No token available');
      router.push('/auth/login');
      return;
    }

    try {
      setIsRefreshing(true);
      console.log('[AdminDashboard] Fetching with token:', token.substring(0, 20) + '...');
      const [dashRes, reviewRes] = await Promise.all([
        fetch('/api/admin/dashboard?refresh=true', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/admin/review-queue', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (dashRes.status === 403) {
        router.push('/dashboard');
        return;
      }

      const dashData = await dashRes.json();
      const reviewData = await reviewRes.json();

      setState((prev) => ({
        ...prev,
        stats: dashData.stats || null,
        reviewQueue: reviewData.items || [],
        error: dashRes.ok ? null : dashData.error,
        lastRefresh: new Date(),
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: t('messages.failedToFetchData'),
        loading: false,
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Handle review decision
  const handleReviewDecision = async (
    questionId: string,
    decision: 'approve' | 'reject',
    notes: string = ''
  ) => {
    if (!token) {
      console.error('[AdminDashboard] No token for review decision');
      return;
    }

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_id: questionId,
          decision,
          notes,
        }),
      });

      if (response.ok) {
        // Refresh data after review
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Review decision failed:', err);
    }
  };

  if (state.loading && !state.stats) {
    return (
      <Layout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('admin.loading')}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">
                {t('admin.dashboard')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('admin.dashboardDescription')}
              </p>
            </div>

            <Button
              onClick={() => fetchDashboard()}
              disabled={isRefreshing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              {t('common.refresh')}
            </Button>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              <p className="font-medium">Error: {state.error}</p>
            </div>
          )}

          {/* System Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {t('admin.systemOverview')}
            </h2>
            <SystemMetrics stats={state.stats} isLoading={state.loading} />
          </div>

          {/* Cache Info */}
          {state.stats && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('admin.lastUpdated', { time: new Date(state.stats.cached_at).toLocaleTimeString() })}
            </div>
          )}

          {/* Import History */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {t('admin.importHistory')}
            </h2>
            <ImportHistory
              imports={state.stats?.recent_imports || []}
              isLoading={state.loading}
              onViewDetails={(id) =>
                router.push(`/admin/imports/${id}`)
              }
              onRollback={(id) =>
                handleReviewDecision(id, 'reject', t('admin.importRolledBack'))
              }
            />
          </div>

          {/* Review Queue */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {t('admin.questionReviewQueue')}
            </h2>
            <ReviewQueuePanel
              items={state.reviewQueue}
              isLoading={state.loading}
              onApprove={(questionId) =>
                handleReviewDecision(questionId, 'approve')
              }
              onReject={(questionId, notes) =>
                handleReviewDecision(questionId, 'reject', notes)
              }
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

