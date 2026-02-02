import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ResultsPage } from '../ResultsPage';

const mockResults = {
  attempt_id: 'attempt-1',
  score: 85,
  passing: true,
  total_questions: 10,
  correct_answers: 8,
  started_at: '2026-02-01T10:00:00Z',
  completed_at: '2026-02-01T10:30:00Z',
  time_spent_minutes: 30,
  weak_areas: [
    {
      topic: 'Algebra',
      accuracy: 40,
      total: 5,
      correct: 2,
    },
  ],
  answers: [
    {
      question_id: '1',
      question_text: 'What is 2+2?',
      user_answer_index: 1,
      correct_answer_index: 1,
      is_correct: true,
      time_spent_seconds: 45,
    },
    {
      question_id: '2',
      question_text: 'Solve x+5=10',
      user_answer_index: 0,
      correct_answer_index: 2,
      is_correct: false,
      time_spent_seconds: 120,
    },
  ],
};

describe('ResultsPage', () => {
  it('should display score and passing status', () => {
    const onRetake = vi.fn();
    render(
      <ResultsPage results={mockResults} onRetake={onRetake} />
    );

    expect(screen.getByText('80.0')).toBeInTheDocument(); // 8/10 = 80%
    expect(screen.getByText('✓ Passed')).toBeInTheDocument();
  });

  it('should display failing status when score is below passing', () => {
    const onRetake = vi.fn();
    const failingResults = {
      ...mockResults,
      score: 45,
      passing: false,
      correct_answers: 4,
    };

    render(
      <ResultsPage results={failingResults} onRetake={onRetake} />
    );

    expect(screen.getByText('✗ Failed')).toBeInTheDocument();
  });

  it('should display statistics', () => {
    const onRetake = vi.fn();
    render(
      <ResultsPage results={mockResults} onRetake={onRetake} />
    );

    expect(screen.getByText('8 out of 10 questions correct')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument(); // Time spent
  });

  it('should display topic breakdown', () => {
    const onRetake = vi.fn();
    render(
      <ResultsPage results={mockResults} onRetake={onRetake} />
    );

    expect(screen.getByText('Topic Breakdown')).toBeInTheDocument();
  });

  it('should highlight weak areas', () => {
    const onRetake = vi.fn();
    render(
      <ResultsPage results={mockResults} onRetake={onRetake} />
    );

    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    expect(screen.getByText(/algebra/i)).toBeInTheDocument();
  });

  it('should not display weak areas section if none exist', () => {
    const onRetake = vi.fn();
    const resultsWithoutWeakAreas = {
      ...mockResults,
      weak_areas: [],
    };

    render(
      <ResultsPage results={resultsWithoutWeakAreas} onRetake={onRetake} />
    );

    expect(screen.queryByText('Areas for Improvement')).not.toBeInTheDocument();
  });

  it('should display answer review', () => {
    const onReview = vi.fn();
    render(
      <ResultsPage results={mockResults} onReview={onReview} />
    );

    expect(screen.getByText('Answer Review')).toBeInTheDocument();
    expect(screen.getByText(/what is 2\+2/i)).toBeInTheDocument();
  });

  it('should show correct badges for correct answers', () => {
    const onReview = vi.fn();
    render(
      <ResultsPage results={mockResults} onReview={onReview} />
    );

    const correctBadges = screen.getAllByText(/✓ correct/i);
    expect(correctBadges.length).toBeGreaterThan(0);
  });

  it('should show incorrect badges for incorrect answers', () => {
    const onReview = vi.fn();
    render(
      <ResultsPage results={mockResults} onReview={onReview} />
    );

    const incorrectBadges = screen.getAllByText(/✗ incorrect/i);
    expect(incorrectBadges.length).toBeGreaterThan(0);
  });

  it('should call onRetake when button is clicked', async () => {
    const onRetake = vi.fn();
    const user = userEvent.setup();

    render(
      <ResultsPage results={mockResults} onRetake={onRetake} />
    );

    const retakeButton = screen.getByRole('button', { name: /retake exam/i });
    await user.click(retakeButton);

    expect(onRetake).toHaveBeenCalled();
  });

  it('should call onReview when button is clicked', async () => {
    const onReview = vi.fn();
    const user = userEvent.setup();

    render(
      <ResultsPage results={mockResults} onReview={onReview} />
    );

    const reviewButton = screen.getByRole('button', { name: /full review/i });
    await user.click(reviewButton);

    expect(onReview).toHaveBeenCalled();
  });

  it('should call onShare when button is clicked', async () => {
    const onShare = vi.fn();
    const user = userEvent.setup();

    render(
      <ResultsPage results={mockResults} onShare={onShare} />
    );

    const shareButton = screen.getByRole('button', { name: /share results/i });
    await user.click(shareButton);

    expect(onShare).toHaveBeenCalled();
  });

  it('should disable action buttons when loading', () => {
    const onRetake = vi.fn();
    const onReview = vi.fn();

    render(
      <ResultsPage
        results={mockResults}
        onRetake={onRetake}
        onReview={onReview}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /retake exam/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /full review/i })).toBeDisabled();
  });


  it('should show "more questions" text when answers exceed display limit', () => {
    const onReview = vi.fn();
    const manyAnswers = {
      ...mockResults,
      answers: Array.from({ length: 20 }, (_, i) => ({
        question_id: `${i}`,
        question_text: `Question ${i}`,
        user_answer_index: 0,
        correct_answer_index: 0,
        is_correct: true,
        time_spent_seconds: 60,
      })),
    };

    render(
      <ResultsPage results={manyAnswers} onReview={onReview} />
    );

    expect(screen.getByText(/\+15 more questions/i)).toBeInTheDocument();
  });
});
