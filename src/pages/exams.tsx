import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useExamStore, useUIStore } from '@/stores';
import { Layout } from '@/components/layout';
import { ExamBuilder, ExamHistory } from '@/components/exam';
import { Tabs } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useI18n } from '@/i18n/i18nContext';

interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  options: string[];
}

export default function ExamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();
  const { t } = useI18n();
  const { setSelectedQuestions, setExamName, setExamDescription, setDuration, setPassingScore } =
    useExamStore();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch available questions for exam builder
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchQuestions();
    }
  }, [user]);

  const handleSaveExam = async (examData: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
      });

      if (!response.ok) throw new Error('Failed to create exam');
      const createdExam = await response.json();

      // Redirect to exam details page
      router.push(`/exams/${createdExam.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setIsLoading(false);
    }
  };

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
                  {t('exams.title')}
                </h1>
                <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('exams.subtitle')}
                </p>
              </div>
              {activeTab === 'history' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                  {t('exams.createButton')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } mb-8`}
          >
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'history'
                    ? `text-blue-600 border-b-2 border-blue-600 ${
                        darkMode ? 'bg-gray-700' : 'bg-blue-50'
                      }`
                    : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                {t('exams.historyTab')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'create'
                    ? `text-blue-600 border-b-2 border-blue-600 ${
                        darkMode ? 'bg-gray-700' : 'bg-blue-50'
                      }`
                    : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                {t('exams.createTab')}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'history' && <ExamHistory attempts={[]} />}

              {activeTab === 'create' && (
                <div>
                  <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Build Your Custom Exam
                  </h2>
                  {questions.length === 0 && !isLoading ? (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>No questions available. Please try again later.</p>
                    </div>
                  ) : (
                    <ExamBuilder
                      questions={questions}
                      onSave={handleSaveExam}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
