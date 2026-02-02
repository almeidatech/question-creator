import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExamTaker } from '../ExamTaker';

const mockQuestions = [
  {
    id: '1',
    text: 'What is 2+2?',
    difficulty: 'easy' as const,
    topic: 'Math',
    options: ['3', '4', '5', '6'],
  },
  {
    id: '2',
    text: 'What is 5*5?',
    difficulty: 'easy' as const,
    topic: 'Math',
    options: ['20', '25', '30', '35'],
  },
  {
    id: '3',
    text: 'What is the capital of France?',
    difficulty: 'easy' as const,
    topic: 'Geography',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
  },
];

describe('ExamTaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render the first question', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should display timer', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('00:30:00')).toBeInTheDocument();
  });

  it('should select an option', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const optionButton = screen.getByRole('button', { name: /^A\. 3$/ });
    await user.click(optionButton);

    expect(optionButton).toHaveClass('selected');
  });

  it('should navigate to next question', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next →/i });
    await user.click(nextButton);

    expect(screen.getByText(/question 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('What is 5*5?')).toBeInTheDocument();
  });

  it('should navigate to previous question', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    // Go to second question
    let nextButton = screen.getByRole('button', { name: /next →/i });
    await user.click(nextButton);

    expect(screen.getByText(/question 2 of 3/i)).toBeInTheDocument();

    // Go back to first question
    const prevButton = screen.getByRole('button', { name: /← previous/i });
    await user.click(prevButton);

    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
  });

  it('should show progress indicator', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/answered: 0\/3/i)).toBeInTheDocument();
  });

  it('should update progress when answer is selected', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const optionButton = screen.getByRole('button', { name: /^A\. 3$/ });
    await user.click(optionButton);

    expect(screen.getByText(/answered: 1\/3/i)).toBeInTheDocument();
  });

  it('should disable Previous button on first question', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const prevButton = screen.getByRole('button', { name: /← previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable Next button on last question', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    // Navigate to last question
    let nextButton = screen.getByRole('button', { name: /next →/i });
    await user.click(nextButton);
    await user.click(nextButton);

    nextButton = screen.queryByRole('button', { name: /next →/i });
    expect(nextButton).toBeDisabled();
  });

  it('should have question navigator buttons', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const questionButtons = screen.getAllByRole('button', { name: /^[123]$/ });
    expect(questionButtons).toHaveLength(3);
  });

  it('should navigate using question navigator', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const questionButton3 = screen.getByRole('button', { name: /^3$/ });
    await user.click(questionButton3);

    expect(screen.getByText(/question 3 of 3/i)).toBeInTheDocument();
  });

  it('should highlight current question in navigator', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const questionButton2 = screen.getByRole('button', { name: /^2$/ });
    await user.click(questionButton2);

    expect(questionButton2).toHaveClass('current');
  });

  it('should call onComplete with answers when submitting', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    // Answer question
    const optionButton = screen.getByRole('button', { name: /^B\. 4$/ });
    await user.click(optionButton);

    // Submit
    const completeButton = screen.getByRole('button', { name: /complete & submit/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          '1': expect.any(Number),
        })
      );
    });
  });

  it('should disable submit button if no answers selected', () => {
    const onComplete = vi.fn();
    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    const completeButton = screen.getByRole('button', { name: /complete & submit/i });
    expect(completeButton).toBeDisabled();
  });

  it('should trigger time warning callback', async () => {
    const onComplete = vi.fn();
    const onTimeWarning = vi.fn();

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
        onTimeWarning={onTimeWarning}
      />
    );

    // Advance to 5 minutes remaining (25 minutes have passed)
    vi.advanceTimersByTime(25 * 60 * 1000);

    expect(onTimeWarning).toHaveBeenCalled();
  });

  it('should auto-submit when time expires', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);

    render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={1}
        onComplete={onComplete}
      />
    );

    // Advance time past expiration
    vi.advanceTimersByTime(61 * 1000);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should show loading state while submitting', async () => {
    const onComplete = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    const user = userEvent.setup({ delay: null });

    const { rerender } = render(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
      />
    );

    // Select answer
    const optionButton = screen.getByRole('button', { name: /^A\. 3$/ });
    await user.click(optionButton);

    // Click submit
    const submitButton = screen.getByRole('button', { name: /complete & submit/i });
    await user.click(submitButton);

    // Rerender with isLoading
    rerender(
      <ExamTaker
        attemptId="1"
        questions={mockQuestions}
        durationMinutes={30}
        onComplete={onComplete}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /complete & submit/i })).toBeDisabled();
  });
});
