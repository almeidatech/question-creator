import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { useI18n } from '@/i18n/i18nContext';
import styles from './ExamHistory.module.css';

interface ExamAttempt {
  id: string;
  exam_name: string;
  score: number;
  passing: boolean;
  total_questions: number;
  correct_answers: number;
  attempted_at: string;
  time_spent_minutes: number;
}

interface ExamHistoryProps {
  attempts: ExamAttempt[];
  onReview?: (attemptId: string) => void;
  onRetake?: (examId: string) => void;
  onDelete?: (attemptId: string) => Promise<void>;
  isLoading?: boolean;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const ExamHistory: React.FC<ExamHistoryProps> = ({
  attempts,
  onReview,
  onRetake,
  onDelete,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredAttempts = useMemo(() => {
    let filtered = [...attempts];

    // Search filter
    filtered = filtered.filter(a =>
      a.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a =>
        filterStatus === 'passed' ? a.passing : !a.passing
      );
    }

    // Date filter
    if (dateFilter !== 'all') {

      const cutoffDate = dateFilter === 'week' ? weekAgo : monthAgo;
      filtered = filtered.filter(a => new Date(a.attempted_at) >= cutoffDate);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort(
        (a, b) =>
          new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
      );
    } else {
      filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [attempts, searchTerm, filterStatus, dateFilter, sortBy]);

  const stats = useMemo(() => {
    const passed = attempts.filter(a => a.passing).length;
    const failed = attempts.length - passed;
    const avgScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
      : 0;

    return {
      total: attempts.length,
      passed,
      failed,
      avgScore,
      passRate: attempts.length > 0 ? (passed / attempts.length) * 100 : 0,
    };
  }, [attempts]);

  const handleDelete = async (attemptId: string) => {
    if (!onDelete || !confirm(t('messages.confirmDelete'))) {
      return;
    }

    setDeletingId(attemptId);
    try {
      await onDelete(attemptId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <h3>{t('exams.totalAttempts')}</h3>
          <p className={styles.statValue}>{stats.total}</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('exams.passed')}</h3>
          <p className={`${styles.statValue} ${styles.success}`}>{stats.passed}</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('exams.failed')}</h3>
          <p className={`${styles.statValue} ${stats.failed > 0 ? styles.error : ''}`}>
            {stats.failed}
          </p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('exams.averageScore')}</h3>
          <p className={styles.statValue}>{stats.avgScore.toFixed(1)}%</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('exams.passRate')}</h3>
          <p className={styles.statValue}>{stats.passRate.toFixed(0)}%</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <Input
            placeholder={t('exams.searchExams')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'passed' | 'failed')}
          >
            <option value="all">{t('exams.allResults')}</option>
            <option value="passed">{t('exams.passed')}</option>
            <option value="failed">{t('exams.failed')}</option>
          </Select>

          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'week' | 'month')}
          >
            <option value="all">{t('exams.allDates')}</option>
            <option value="week">{t('exams.lastWeek')}</option>
            <option value="month">{t('exams.lastMonth')}</option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
          >
            <option value="date">{t('exams.newestFirst')}</option>
            <option value="score">{t('exams.highestScore')}</option>
          </Select>
        </div>
      </Card>

      {/* Attempts Table */}
      <Card className={styles.tableCard}>
        {filteredAttempts.length === 0 ? (
          <p className={styles.noAttempts}>{t('exams.noAttemptsFound')}</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('exams.exam')}</th>
                  <th>{t('exams.date')}</th>
                  <th>{t('exams.score')}</th>
                  <th>{t('exams.status')}</th>
                  <th>{t('exams.questions')}</th>
                  <th>{t('exams.time')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map(attempt => (
                  <tr key={attempt.id}>
                    <td className={styles.examName}>{attempt.exam_name}</td>
                    <td className={styles.date}>{formatDate(attempt.attempted_at)}</td>
                    <td className={styles.score}>
                      <strong>{((attempt.correct_answers / attempt.total_questions) * 100).toFixed(1)}%</strong>
                    </td>
                    <td className={styles.status}>
                      <Badge
                        className={attempt.passing ? styles.passingBadge : styles.failingBadge}
                      >
                        {attempt.passing ? t('exams.passed') : t('exams.failed')}
                      </Badge>
                    </td>
                    <td className={styles.questions}>
                      {attempt.correct_answers}/{attempt.total_questions}
                    </td>
                    <td className={styles.time}>{formatTime(attempt.time_spent_minutes)}</td>
                    <td className={styles.actions}>
                      <div className={styles.actionButtons}>
                        {onReview && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onReview(attempt.id)}
                            disabled={isLoading}
                          >
                            {t('exams.review')}
                          </Button>
                        )}

                        {onRetake && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRetake(attempt.id)}
                            disabled={isLoading}
                          >
                            {t('exams.retake')}
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDelete(attempt.id)}
                            disabled={deletingId === attempt.id || isLoading}
                          >
                            {deletingId === attempt.id ? t('exams.deleting') : t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

