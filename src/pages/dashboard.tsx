'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useDashboardStore, useUIStore } from '@/stores';
import { Layout } from '@/components/layout';
import {
  StatsCard,
  ActivityChart,
  WeakAreasList,
  QuickActionButtons,
} from '@/components/dashboard';
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  Flame,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, activity, weakAreas, loading, error, refreshStats } =
    useDashboardStore();
  const { darkMode } = useUIStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else {
      setIsInitializing(false);
    }
  }, [user, router]);

  // Fetch dashboard stats on mount
  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user, refreshStats]);

  if (isInitializing || !user) {
    return (
      <Layout currentRoute="/dashboard" requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  const handleGenerateQuestions = () => {
    router.push('/questions');
  };

  const handleCreateExam = () => {
    router.push('/exams');
  };

  const handleReviewHistory = () => {
    router.push('/exams');
  };

  return (
    <Layout currentRoute="/dashboard" requireAuth={true}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header Section */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user.first_name || 'Student'}!
            </h1>
            <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Here's your learning progress and quick actions.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              label="Questions Attempted"
              value={stats?.total_questions_attempted || 0}
              trend={12}
              icon={<BookOpen size={24} />}
              color="blue"
            />
            <StatsCard
              label="Correct Answers"
              value={stats?.correct_count || 0}
              trend={8}
              icon={<CheckCircle size={24} />}
              color="green"
            />
            <StatsCard
              label="Accuracy Rate"
              value={`${stats?.accuracy_percentage || 0}%`}
              trend={-2}
              icon={<TrendingUp size={24} />}
              color="purple"
            />
            <StatsCard
              label="Current Streak"
              value={stats?.streak_days || 0}
              trend={3}
              icon={<Flame size={24} />}
              color="orange"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Activity Chart - Takes 2 columns on desktop */}
            <div
              className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } p-6`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                This Week's Activity
              </h2>
              {activity && activity.length > 0 ? (
                <ActivityChart data={activity} type="bar" />
              ) : (
                <div className={`h-64 flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No activity data yet. Start practicing to see your progress!
                </div>
              )}
            </div>

            {/* Weak Areas - Takes 1 column */}
            <div
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } p-6`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Areas to Improve
              </h2>
              {weakAreas && weakAreas.length > 0 ? (
                <WeakAreasList areas={weakAreas} />
              ) : (
                <div className={`h-64 flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No weak areas detected. Keep up the great work!
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } p-6`}
          >
            <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Actions
            </h2>
            <QuickActionButtons
              onGenerate={handleGenerateQuestions}
              onCreateExam={handleCreateExam}
              onReview={handleReviewHistory}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
              Loading latest data...
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
