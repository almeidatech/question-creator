import React, { useState, useCallback } from 'react';
import { Card, Button, Input, Select, Badge, Spinner } from '@/components/ui';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { useI18n } from '@/i18n/i18nContext';
import styles from './ExamBuilder.module.css';

interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  options: string[];
}

interface ExamFormData {
  name: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  question_ids: string[];
}

interface ExamBuilderProps {
  questions: Question[];
  onSave: (exam: ExamFormData) => Promise<void>;
  isLoading?: boolean;
}

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const MIN_DURATION = 5;
const MAX_DURATION = 180;

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  questions,
  onSave,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ExamFormData>({
    name: '',
    description: '',
    duration_minutes: 60,
    passing_score: 70,
    question_ids: [],
  });

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchesTopic = topicFilter === 'all' || q.topic === topicFilter;
    const isNotSelected = !selectedQuestions.find(sq => sq.id === q.id);

    return matchesSearch && matchesDifficulty && matchesTopic && isNotSelected;
  });

  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic)));

  const estimatedDuration = selectedQuestions.length > 0
    ? Math.ceil((formData.duration_minutes / selectedQuestions.length) * selectedQuestions.length)
    : 0;

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.examNameRequired');
    }

    if (selectedQuestions.length < MIN_QUESTIONS) {
      newErrors.questions = t('validation.minQuestionsRequired', { min: MIN_QUESTIONS });
    }

    if (selectedQuestions.length > MAX_QUESTIONS) {
      newErrors.questions = t('validation.maxQuestionsAllowed', { max: MAX_QUESTIONS });
    }

    if (formData.duration_minutes < MIN_DURATION || formData.duration_minutes > MAX_DURATION) {
      newErrors.duration = t('validation.durationRange', { min: MIN_DURATION, max: MAX_DURATION });
    }

    if (formData.passing_score < 0 || formData.passing_score > 100) {
      newErrors.passing_score = t('validation.passingScoreRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedQuestions, t]);

  const handleAddQuestion = (question: Question) => {
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const handleRemoveQuestion = (id: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== id));
  };

  const handleReorder = (draggedIdx: number, droppedIdx: number) => {
    const newQuestions = [...selectedQuestions];
    const [movedQuestion] = newQuestions.splice(draggedIdx, 1);
    newQuestions.splice(droppedIdx, 0, movedQuestion);
    setSelectedQuestions(newQuestions);
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const examData: ExamFormData = {
      ...formData,
      question_ids: selectedQuestions.map(q => q.id),
    };

    try {
      await onSave(examData);
    } catch (error) {
      setErrors({ submit: t('messages.failedToSaveExam') });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <h2>{t('exams.createExam')}</h2>
          </div>

          {/* Form Fields */}
          <div className={styles.formGroup}>
            <label htmlFor="name">{t('exams.examName')}</label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('exams.examNamePlaceholder')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className={styles.error}>{errors.name}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">{t('common.description')}</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('exams.descriptionPlaceholder')}
              className="w-full px-4 py-2 text-base border-2 rounded-lg transition-colors focus:outline-none border-neutral-300 text-neutral-900 placeholder-neutral-400 hover:border-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="duration">{t('exams.duration')}</label>
              <Input
                id="duration"
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || 0,
                  })
                }
                aria-invalid={!!errors.duration}
              />
              {errors.duration && <p className={styles.error}>{errors.duration}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passingScore">{t('exams.passingScore')}</label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passing_score: parseInt(e.target.value) || 0,
                  })
                }
                aria-invalid={!!errors.passing_score}
              />
              {errors.passing_score && <p className={styles.error}>{errors.passing_score}</p>}
            </div>
          </div>

          <Button onClick={handleSave} disabled={isLoading} className={styles.saveButton}>
            {isLoading ? <Spinner size="sm" /> : t('exams.saveExam')}
          </Button>

          {errors.submit && <p className={styles.error}>{errors.submit}</p>}
        </Card>

        {/* Summary Panel */}
        <Card className={styles.summaryCard}>
          <h3>{t('common.summary')}</h3>
          <div className={styles.summary}>
            <p>
              <strong>{t('exams.questions')}:</strong> {selectedQuestions.length}/{MAX_QUESTIONS}
            </p>
            <p>
              <strong>{t('exams.duration')}:</strong> {formData.duration_minutes} {t('exams.minutes')}
            </p>
            <p>
              <strong>{t('exams.avgPerQuestion')}:</strong>{' '}
              {selectedQuestions.length > 0
                ? Math.round((formData.duration_minutes / selectedQuestions.length) * 60)
                : 0}{' '}
              {t('exams.seconds')}
            </p>
            <p>
              <strong>{t('exams.passingScore')}:</strong> {formData.passing_score}%
            </p>
          </div>
          {errors.questions && <p className={styles.error}>{errors.questions}</p>}
        </Card>
      </div>

      <div className={styles.questionsSection}>
        {/* Search and Filter */}
        <Card className={styles.card}>
          <h3>{t('exams.selectQuestions')}</h3>

          <div className={styles.filterGroup}>
            <Input
              placeholder={t('exams.searchQuestions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">{t('exams.allDifficulties')}</option>
              <option value="easy">{t('difficulty.easy')}</option>
              <option value="medium">{t('difficulty.medium')}</option>
              <option value="hard">{t('difficulty.hard')}</option>
            </Select>

            <Select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="all">{t('exams.allTopics')}</option>
              {uniqueTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </Select>
          </div>

          {/* Available Questions List */}
          <div className={styles.questionsList}>
            {filteredQuestions.length === 0 ? (
              <p className={styles.noQuestions}>{t('exams.noQuestionsMatch')}</p>
            ) : (
              filteredQuestions.map(question => (
                <div key={question.id} className={styles.questionItem}>
                  <div className={styles.questionInfo}>
                    <p>{question.text}</p>
                    <div className={styles.questionMeta}>
                      <DifficultyBadge difficulty={question.difficulty} />
                      <Badge>{question.topic}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddQuestion(question)}
                    variant="secondary"
                  >
                    {t('exams.add')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Selected Questions (Reorderable) */}
        <Card className={styles.card}>
          <h3>{t('exams.selectedQuestions', { count: selectedQuestions.length })}</h3>

          {selectedQuestions.length === 0 ? (
            <p className={styles.noQuestions}>{t('exams.noQuestionsSelected')}</p>
          ) : (
            <div className={styles.selectedList}>
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className={`${styles.selectedItem} ${
                    draggedIndex === index ? styles.dragging : ''
                  }`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedIndex !== null && handleReorder(draggedIndex, index)}
                >
                  <span className={styles.dragHandle}>⋮⋮</span>
                  <div className={styles.questionInfo}>
                    <p>
                      {index + 1}. {question.text}
                    </p>
                    <div className={styles.questionMeta}>
                      <DifficultyBadge difficulty={question.difficulty} />
                      <Badge>{question.topic}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRemoveQuestion(question.id)}
                  >
                    {t('exams.remove')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

