import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import { Layout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { SearchIcon, Plus, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  options: string[];
}

export default function QuestionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useUIStore();
  const { t } = useI18n();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Auth guard
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else {
      setIsInitializing(false);
    }
  }, [user, router]);

  // Fetch questions on mount
  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.questions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic !== 'all' ? selectedTopic : undefined,
          count: 5,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate questions');
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const topics = Array.from(new Set(questions.map((q) => q.topic)));
  const difficultyColor = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  if (isInitializing || !user) {
    return (
      <Layout currentRoute="/questions" requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentRoute="/questions" requireAuth={true}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header Section */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('questions.title')}
                </h1>
                <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('questions.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
                {t('questions.generateButton')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filters */}
          <div
            className={`rounded-lg border ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } p-6 mb-6`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon
                  className={`absolute left-3 top-3 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  size={20}
                />
                <Input
                  type="text"
                  placeholder={t('questions.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Topic Filter */}
              <div>
                <label htmlFor="topic-select" className="sr-only">
                  Filter by topic
                </label>
                <select
                  id="topic-select"
                  aria-label="Filter questions by topic"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                <option value="all">{t('questions.allTopics')}</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {isLoading && filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading questions...
                </p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div
                className={`text-center py-12 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No questions found. Try generating some!
                </p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`rounded-lg border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } p-6 cursor-pointer transition-colors`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {question.text}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            difficultyColor[question.difficulty]
                          }`}
                        >
                          {question.difficulty}
                        </span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Topic: {question.topic}
                        </span>
                      </div>
                    </div>
                    <Button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div
            className={`mt-8 rounded-lg border ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } p-6 text-center`}
          >
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
