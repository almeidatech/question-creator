import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ExamBuilder } from '../ExamBuilder';

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
    text: 'What is the capital of France?',
    difficulty: 'easy' as const,
    topic: 'Geography',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
  },
  {
    id: '3',
    text: 'Explain photosynthesis',
    difficulty: 'medium' as const,
    topic: 'Biology',
    options: ['A', 'B', 'C', 'D'],
  },
];

describe('ExamBuilder', () => {
  it('should render form fields', () => {
    const onSave = vi.fn();
    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    expect(screen.getByLabelText(/exam name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/passing score/i)).toBeInTheDocument();
  });

  it('should validate exam name is required', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    // Add minimum questions
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButtons[i]);
    }

    // Try to save without name
    await user.click(screen.getByRole('button', { name: /save exam/i }));

    expect(screen.getByText(/exam name is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should validate minimum questions requirement', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    // Set exam name
    const nameInput = screen.getByLabelText(/exam name/i);
    await user.type(nameInput, 'Test Exam');

    // Add only 3 questions (minimum is 5)
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 3; i++) {
      await user.click(addButtons[i]);
    }

    // Try to save
    await user.click(screen.getByRole('button', { name: /save exam/i }));

    expect(screen.getByText(/minimum 5 questions required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should add questions to selected list', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    await user.click(addButtons[0]);

    expect(screen.getByText(/1\. What is 2\+2\?/)).toBeInTheDocument();
  });

  it('should remove questions from selected list', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    // Add question
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    await user.click(addButtons[0]);

    expect(screen.getByText(/1\. What is 2\+2\?/)).toBeInTheDocument();

    // Remove question
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(screen.queryByText(/1\. What is 2\+2\?/)).not.toBeInTheDocument();
  });

  it('should filter questions by difficulty', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const difficultySelect = screen.getByDisplayValue(/all difficulties/i);
    await user.selectOptions(difficultySelect, 'medium');

    await waitFor(() => {
      expect(screen.getByText(/explain photosynthesis/i)).toBeInTheDocument();
    });

    // Easy questions should be hidden
    expect(screen.queryByText(/what is 2\+2/i)).not.toBeInTheDocument();
  });

  it('should filter questions by topic', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const topicSelect = screen.getByDisplayValue(/all topics/i);
    await user.selectOptions(topicSelect, 'Biology');

    await waitFor(() => {
      expect(screen.getByText(/explain photosynthesis/i)).toBeInTheDocument();
    });
  });

  it('should search questions by text', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const searchInput = screen.getByPlaceholderText(/search questions/i);
    await user.type(searchInput, 'capital');

    await waitFor(() => {
      expect(screen.getByText(/what is the capital/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/what is 2\+2/i)).not.toBeInTheDocument();
  });

  it('should validate duration range', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const durationInput = screen.getByLabelText(/duration/i) as HTMLInputElement;

    // Set invalid duration (too low)
    await user.clear(durationInput);
    await user.type(durationInput, '2');

    // Set exam name and add questions
    const nameInput = screen.getByLabelText(/exam name/i);
    await user.type(nameInput, 'Test Exam');

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButtons[i]);
    }

    await user.click(screen.getByRole('button', { name: /save exam/i }));

    expect(screen.getByText(/duration must be between 5 and 180/i)).toBeInTheDocument();
  });

  it('should validate passing score range', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    const passingScoreInput = screen.getByLabelText(/passing score/i) as HTMLInputElement;

    // Set invalid score
    await user.clear(passingScoreInput);
    await user.type(passingScoreInput, '150');

    // Set exam name and add questions
    const nameInput = screen.getByLabelText(/exam name/i);
    await user.type(nameInput, 'Test Exam');

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButtons[i]);
    }

    await user.click(screen.getByRole('button', { name: /save exam/i }));

    expect(screen.getByText(/passing score must be between 0 and 100/i)).toBeInTheDocument();
  });

  it('should call onSave with correct data when form is valid', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    // Fill form
    const nameInput = screen.getByLabelText(/exam name/i);
    await user.type(nameInput, 'Test Exam');

    // Add 5 questions
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButtons[i]);
    }

    // Save
    await user.click(screen.getByRole('button', { name: /save exam/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Exam',
          question_ids: expect.arrayContaining(['1', '2', '3']),
        })
      );
    });
  });

  it('should show loading state when saving', async () => {
    const onSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    const user = userEvent.setup();

    const { rerender } = render(
      <ExamBuilder questions={mockQuestions} onSave={onSave} />
    );

    // Fill form
    const nameInput = screen.getByLabelText(/exam name/i);
    await user.type(nameInput, 'Test Exam');

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    for (let i = 0; i < 5; i++) {
      await user.click(addButtons[i]);
    }

    // Click save
    const saveButton = screen.getByRole('button', { name: /save exam/i });
    await user.click(saveButton);

    // Rerender with isLoading
    rerender(
      <ExamBuilder questions={mockQuestions} onSave={onSave} isLoading={true} />
    );

    expect(screen.getByRole('button', { name: /save exam/i })).toBeDisabled();
  });
});
