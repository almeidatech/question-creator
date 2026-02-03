import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionCard, Question } from '../QuestionCard';
import React from 'react';

describe('QuestionCard', () => {
  const mockQuestion: Question = {
    id: '1',
    text: 'What is 2 + 2?',
    options: {
      a: '3',
      b: '4',
      c: '5',
      d: '6',
    },
    correct_answer: 'b',
    explanation: 'The sum of 2 and 2 is 4.',
  };

  const mockOnSubmit = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders question text', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('renders all answer options', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('disables submit button initially', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );
    const submitButton = screen.getByText(/submit answer/i) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('enables submit button when option selected', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i) as HTMLButtonElement;
    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it('calls onSubmit with selected option', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('b');
    });
  });

  it('shows explanation after submission', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/the sum of 2 and 2 is 4/i)).toBeInTheDocument();
    });
  });

  it('shows next button after submission', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/next question/i)).toBeInTheDocument();
    });
  });

  it('calls onNext when next button clicked', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      const nextButton = screen.getByText(/next question/i);
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  it('shows correct feedback when answer is right', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  it('shows incorrect feedback when answer is wrong', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionA = screen.getByText('3').closest('button');
    fireEvent.click(optionA!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });
  });

  it('displays question ID', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );
    expect(screen.getByText(/question id: 1/i)).toBeInTheDocument();
  });

  it('prevents option selection after submission', async () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onNext={mockOnNext}
      />
    );

    const optionB = screen.getByText('4').closest('button');
    fireEvent.click(optionB!);

    const submitButton = screen.getByText(/submit answer/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/submit answer/i)).not.toBeInTheDocument();
    });
  });
});

