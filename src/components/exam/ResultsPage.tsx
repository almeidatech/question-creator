import React, { useMemo } from 'react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useI18n } from '@/i18n/i18nContext';
import styles from './ResultsPage.module.css';

interface TopicBreakdown {
  topic: string;
  accuracy: number;
  total: number;
  correct: number;
}

interface Answer {
  question_id: string;
  question_text: string;
  user_answer_index: number;
  correct_answer_index: number;
  is_correct: boolean;
  time_spent_seconds: number;
  topic?: string; // Topic for weak area tracking
  subject_id?: string; // Alternative topic field
}

interface ExamResults {
  attempt_id: string;
  score: number;
  passing: boolean;
  total_questions: number;
  correct_answers: number;
  started_at: string;
  completed_at: string;
  time_spent_minutes: number;
  weak_areas: TopicBreakdown[];
  answers: Answer[];
}

interface ResultsPageProps {
  results: ExamResults;
  onRetake?: () => void;
  onReview?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
}

const formatTime = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const calculateTopicStats = (answers: Answer[]): Record<string, TopicBreakdown> => {
  const stats: Record<string, TopicBreakdown> = {};

  answers.forEach(answer => {
    // Extract topic from answer data
    const topic = answer.topic || answer.subject_id || 'General';

    if (!stats[topic]) {
      stats[topic] = {
        topic,
        accuracy: 0,
        total: 0,
        correct: 0,
      };
    }

    stats[topic].total += 1;
    if (answer.is_correct) {
      stats[topic].correct += 1;
    }
    stats[topic].accuracy = (stats[topic].correct / stats[topic].total) * 100;
  });

  return stats;
};

export const ResultsPage: React.FC<ResultsPageProps> = ({
  results,
  onRetake,
  onReview,
  onShare,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const topicStats = useMemo(
    () => calculateTopicStats(results.answers),
    [results.answers]
  );

  const weekAreas = Object.values(topicStats).filter(t => t.accuracy < 50);

  const scorePercentage = ((results.correct_answers / results.total_questions) * 100).toFixed(1);

  return (
    <div className={styles.container}>
      {/* Score Display */}
      <Card className={`${styles.scoreCard} ${results.passing ? styles.passing : styles.failing}`}>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{scorePercentage}</span>
            <span className={styles.scorePercent}>%</span>
          </div>
          <div className={styles.scoreInfo}>
            <h1 className={styles.status}>
              {results.passing ? t('results.passed') : t('results.failed')}
            </h1>
            <p className={styles.details}>
              {t('results.questionsCorrect', { correct: results.correct_answers, total: results.total_questions })}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <h3>{t('results.timeSpent')}</h3>
          <p className={styles.statValue}>{formatTime(results.time_spent_minutes)}</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('exams.questions')}</h3>
          <p className={styles.statValue}>{results.total_questions}</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('results.accuracy')}</h3>
          <p className={styles.statValue}>{scorePercentage}%</p>
        </Card>

        <Card className={styles.statCard}>
          <h3>{t('results.weakAreas')}</h3>
          <p className={styles.statValue}>{weekAreas.length}</p>
        </Card>
      </div>

      {/* Topic Breakdown */}
      <Card className={styles.section}>
        <h2>{t('results.topicBreakdown')}</h2>
        <div className={styles.topicList}>
          {Object.entries(topicStats).map(([topic, stats]) => (
            <div
              key={topic}
              className={`${styles.topicItem} ${stats.accuracy < 50 ? styles.weak : ''}`}
            >
              <div className={styles.topicHeader}>
                <h4>{topic}</h4>
                {stats.accuracy < 50 && <Badge className={styles.weakBadge}>⚠ {t('results.weak')}</Badge>}
              </div>

              <div className={styles.topicStats}>
                <span>
                  {t('results.correct', { correct: stats.correct, total: stats.total })}
                </span>
                <span className={styles.accuracy}>{stats.accuracy.toFixed(0)}%</span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${stats.accuracy}%`,
                    backgroundColor:
                      stats.accuracy >= 70
                        ? '#10b981'
                        : stats.accuracy >= 50
                          ? '#f59e0b'
                          : '#dc2626',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weak Areas */}
      {weekAreas.length > 0 && (
        <Card className={`${styles.section} ${styles.weakAreasSection}`}>
          <h2>{t('results.areasForImprovement')}</h2>
          <p className={styles.weakAreasText}>
            {t('results.focusOnWeakTopics')}
          </p>
          <ul className={styles.weakAreasList}>
            {weekAreas.map(area => (
              <li key={area.topic}>
                <strong>{area.topic}</strong> ({area.accuracy.toFixed(0)}% {t('results.accuracy')})
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Answer Review */}
      {onReview && (
        <Card className={styles.section}>
          <h2>{t('results.answerReview')}</h2>
          <div className={styles.answersList}>
            {results.answers.slice(0, 5).map((answer, idx) => (
              <div
                key={answer.question_id}
                className={`${styles.answerItem} ${
                  answer.is_correct ? styles.correct : styles.incorrect
                }`}
              >
                <div className={styles.answerQuestion}>
                  <span className={styles.questionNum}>{t('results.questionNum', { num: idx + 1 })}</span>
                  <p>{answer.question_text}</p>
                </div>
                <div className={styles.answerStatus}>
                  {answer.is_correct ? (
                    <Badge className={styles.correctBadge}>{t('results.correct')}</Badge>
                  ) : (
                    <Badge className={styles.incorrectBadge}>{t('results.incorrect')}</Badge>
                  )}
                </div>
              </div>
            ))}
            {results.answers.length > 5 && (
              <p className={styles.moreAnswers}>
                {t('results.moreQuestions', { count: results.answers.length - 5 })}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onRetake && (
          <Button onClick={onRetake} disabled={isLoading} className={styles.actionButton}>
            {isLoading ? <Spinner size="sm" /> : t('exams.retakeExam')}
          </Button>
        )}

        {onReview && (
          <Button
            onClick={onReview}
            variant="secondary"
            disabled={isLoading}
            className={styles.actionButton}
          >
            {isLoading ? <Spinner size="sm" /> : t('results.fullReview')}
          </Button>
        )}

        {onShare && (
          <Button
            onClick={onShare}
            variant="secondary"
            disabled={isLoading}
            className={styles.actionButton}
          >
            {isLoading ? <Spinner size="sm" /> : t('results.shareResults')}
          </Button>
        )}
      </div>
    </div>
  );
};

