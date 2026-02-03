import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useTimer } from './hooks';
import { useI18n } from '@/i18n/i18nContext';
import styles from './ExamTaker.module.css';

interface Question {
  id: string;
  text: string;
  options: string[];
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ExamTakerProps {
  attemptId: string;
  questions: Question[];
  durationMinutes: number;
  onComplete: (answers: Record<string, number>) => Promise<void>;
  onTimeWarning?: () => void;
  isLoading?: boolean;
}

interface Answer {
  questionId: string;
  selectedOptionIndex: number;
  timeSpent: number;
}

export const ExamTaker: React.FC<ExamTakerProps> = ({
  attemptId,
  questions,
  durationMinutes,
  onComplete,
  onTimeWarning,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationSeconds = durationMinutes * 60;

  const handleTimeExpire = useCallback(() => {
    handleCompleteExam();
  }, []);

  const handleWarning = useCallback(() => {
    onTimeWarning?.();
  }, [onTimeWarning]);

  const { remaining, isExpired, timeDisplay, pause, resume, isPaused } = useTimer(
    durationSeconds,
    handleTimeExpire,
    handleWarning
  );

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));

    // Auto-save occurs here (in production, would call API)
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleCompleteExam = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      pause();
      await onComplete(answers);
    } catch (err) {
      setError(t('messages.failedToSubmitExam'));
      resume();
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, pause, resume, isSubmitting, onComplete, t]);

  if (!currentQuestion) {
    return <div>{t('messages.noQuestionsAvailable')}</div>;
  }

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const selectedOptionIndex = answers[currentQuestion.id];

  return (
    <div className={styles.container}>
      {/* Header with Timer */}
      <div className={`${styles.header} ${remaining < 300 ? styles.warning : ''}`}>
        <div className={styles.progressInfo}>
          <h2>{t('exams.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}</h2>
          <span className={styles.answered}>
            {t('exams.answered', { answered: answeredCount, total: questions.length })}
          </span>
        </div>

        <div className={`${styles.timer} ${isExpired ? styles.expired : ''}`}>
          <span className={styles.timeDisplay}>{timeDisplay}</span>
          {remaining < 300 && (
            <span className={styles.warningText}>⚠ {t('messages.timeRunningOut')}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Question Card */}
        <Card className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <h3>{currentQuestion.text}</h3>
            <Badge>{currentQuestion.topic}</Badge>
          </div>

          {/* Options */}
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`${styles.option} ${
                  selectedOptionIndex === index ? styles.selected : ''
                }`}
                onClick={() => handleSelectOption(index)}
                disabled={isExpired || isSubmitting}
              >
                <span className={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className={styles.optionText}>{option}</span>
              </button>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </Card>

        {/* Sidebar - Questions Navigator */}
        <div className={styles.sidebar}>
          <Card className={styles.navigatorCard}>
            <h4>{t('exams.questions')}</h4>
            <div className={styles.questionGrid}>
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  className={`${styles.questionButton} ${
                    idx === currentQuestionIndex ? styles.current : ''
                  } ${answers[q.id] !== undefined ? styles.answered : ''}`}
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setQuestionStartTime(Date.now());
                  }}
                  disabled={isExpired || isSubmitting}
                  title={t('exams.questionNum', { num: idx + 1 })}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className={styles.stats}>
              <p>
                <strong>{t('exams.answered')}:</strong> {answeredCount}
              </p>
              <p>
                <strong>{t('exams.unanswered')}:</strong> {unansweredCount}
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className={styles.actionCard}>
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isExpired || isSubmitting}
              variant="secondary"
              fullWidth
            >
              {t('exams.previous')}
            </Button>

            <Button
              onClick={handleNextQuestion}
              disabled={
                currentQuestionIndex === questions.length - 1 ||
                isExpired ||
                isSubmitting
              }
              variant="secondary"
              fullWidth
            >
              {t('exams.next')}
            </Button>

            <Button
              onClick={handleCompleteExam}
              disabled={isSubmitting || answeredCount === 0}
              fullWidth
              className={styles.submitButton}
            >
              {isSubmitting ? <Spinner size="sm" /> : t('exams.completeSubmit')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

