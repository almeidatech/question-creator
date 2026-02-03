'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useExamStore, useUIStore } from '@/stores';
import { Layout } from '@/components/layout';
import { ExamTaker } from '@/components/exam';
import { Button } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    correct_answer_index: number;
    explanation?: string;
  }>;
}

export default function ExamPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();
  const { initializeAttempt } = useExamStore();

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else {
      setIsInitializing(false);
    }
  }, [user, router]);

  // Fetch exam details
  useEffect(() => {
    const fetchExam = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/exams/${id}`);
        if (!response.ok) throw new Error('Failed to load exam');
        const data = await response.json();
        setExam(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exam');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && id) {
      fetchExam();
    }
  }, [user, id]);

  const handleStartExam = useCallback(() => {
    if (exam) {
      initializeAttempt(exam.id, exam.questions);
      setHasStarted(true);
    }
  }, [exam, initializeAttempt]);

  const handleExitExam = useCallback(() => {
    if (confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
      router.push('/exams');
    }
  }, [router]);

  const handleCompleteExam = useCallback(async (answers: Record<string, number>) => {
    try {
      const response = await fetch(`/api/attempts/${exam?.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('Failed to submit exam');
      const result = await response.json();
      router.push(`/exams/${exam?.id}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
    }
  }, [exam?.id, router]);

  if (isInitializing || !user) {
    return (
      <Layout currentRoute="/exams" requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // If exam not started yet, show start screen
  if (!hasStarted) {
    return (
      <Layout currentRoute="/exams" requireAuth={true}>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className={`flex items-center justify-center min-h-screen`}>
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
                      Error Loading Exam
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
            </div>
          ) : exam ? (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div
                className={`rounded-lg border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } p-8`}
              >
                <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {exam.name}
                </h1>
                {exam.description && (
                  <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {exam.description}
                  </p>
                )}

                {/* Exam Details */}
                <div className="grid grid-cols-3 gap-6 mb-8 py-6 border-y border-gray-200 dark:border-gray-700">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Duration
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {exam.duration_minutes} min
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Questions
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {exam.questions.length}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Passing Score
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {exam.passing_score}%
                    </p>
                  </div>
                </div>

                {/* Warnings */}
                <div
                  className={`p-4 rounded-lg mb-8 ${
                    darkMode
                      ? 'bg-yellow-900 border border-yellow-700 text-yellow-100'
                      : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  }`}
                >
                  <p className="font-medium">⏱️ Important Reminders:</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Once you start, you cannot pause the exam</li>
                    <li>• The exam will auto-submit when time expires</li>
                    <li>• You can review and change your answers before submission</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleStartExam}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Start Exam
                  </Button>
                  <Button
                    onClick={() => router.push('/exams')}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Layout>
    );
  }

  // If exam started, show exam taker component
  if (exam) {
    return (
      <Layout currentRoute="/exams" requireAuth={true}>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <ExamTaker
            attemptId={`attempt_${exam.id}`}
            questions={exam.questions}
            durationMinutes={exam.duration_minutes}
            onComplete={handleCompleteExam}
          />
          <div className="fixed bottom-4 right-4">
            <Button
              onClick={handleExitExam}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Exit Exam
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
