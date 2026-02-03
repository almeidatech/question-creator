'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useUIStore } from '@/stores';
import { Layout } from '@/components/layout';
import { ResultsPage } from '@/components/exam';
import { Button } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface ExamResults {
  id: string;
  attempt_id: string;
  examId: string;
  score: number;
  passing: boolean;
  total_questions: number;
  correct_answers: number;
  started_at: string;
  completed_at: string;
  time_spent_minutes: number;
  weak_areas: Array<{
    topic: string;
    accuracy: number;
    total: number;
    correct: number;
  }>;
  answers: Array<{
    question_id: string;
    question_text: string;
    user_answer_index: number;
    correct_answer_index: number;
    is_correct: boolean;
    time_spent_seconds: number;
  }>;
}

export default function ExamResultsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();

  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else {
      setIsInitializing(false);
    }
  }, [user, router]);

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/attempts/${id}`);
        if (!response.ok) throw new Error('Failed to load results');
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && id) {
      fetchResults();
    }
  }, [user, id]);

  if (isInitializing || !user) {
    return (
      <Layout currentRoute="/exams" requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentRoute="/exams" requireAuth={true}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header Section */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Exam Results
                </h1>
                <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Review your performance and areas for improvement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div
              className={`max-w-md mx-auto p-6 rounded-lg border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="text-red-600 mt-0.5" />
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Error Loading Results
                  </h3>
                  <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {error}
                  </p>
                  <button
                    onClick={() => router.push('/exams')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Back to Exams
                  </button>
                </div>
              </div>
            </div>
          ) : results ? (
            <div>
              {/* Results Component */}
              <ResultsPage results={results} />

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 justify-center">
                <Button
                  onClick={() => router.push('/exams')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Back to Exams
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
