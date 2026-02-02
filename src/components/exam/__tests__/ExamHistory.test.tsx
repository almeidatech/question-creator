import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ExamHistory } from '../ExamHistory';

const mockAttempts = [
  {
    id: 'attempt-1',
    exam_name: 'Math 101 Midterm',
    score: 85,
    passing: true,
    total_questions: 10,
    correct_answers: 8,
    attempted_at: '2026-02-01T10:00:00Z',
    time_spent_minutes: 45,
  },
  {
    id: 'attempt-2',
    exam_name: 'Biology 102 Quiz',
    score: 65,
    passing: false,
    total_questions: 10,
    correct_answers: 6,
    attempted_at: '2026-01-28T14:30:00Z',
    time_spent_minutes: 30,
  },
  {
    id: 'attempt-3',
    exam_name: 'Math 101 Final',
    score: 92,
    passing: true,
    total_questions: 20,
    correct_answers: 18,
    attempted_at: '2026-01-15T09:00:00Z',
    time_spent_minutes: 90,
  },
];

describe('ExamHistory', () => {
  it('should display statistics', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Total attempts
    expect(screen.getByText('2')).toBeInTheDocument(); // Passed (should appear twice, once for passed count)
    expect(screen.getByText('1')).toBeInTheDocument(); // Failed
  });

  it('should display attempts in table', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    expect(screen.getByText('Math 101 Midterm')).toBeInTheDocument();
    expect(screen.getByText('Biology 102 Quiz')).toBeInTheDocument();
    expect(screen.getByText('Math 101 Final')).toBeInTheDocument();
  });

  it('should display passing status badges', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    const passingBadges = screen.getAllByText(/✓ passed/i);
    const failingBadges = screen.getAllByText(/✗ failed/i);

    expect(passingBadges.length).toBeGreaterThan(0);
    expect(failingBadges.length).toBeGreaterThan(0);
  });

  it('should search attempts by exam name', async () => {
    const user = userEvent.setup();
    render(<ExamHistory attempts={mockAttempts} />);

    const searchInput = screen.getByPlaceholderText(/search exams/i);
    await user.type(searchInput, 'Biology');

    await waitFor(() => {
      expect(screen.getByText('Biology 102 Quiz')).toBeInTheDocument();
    });

    expect(screen.queryByText('Math 101 Midterm')).not.toBeInTheDocument();
  });

  it('should filter attempts by passing status', async () => {
    const user = userEvent.setup();
    render(<ExamHistory attempts={mockAttempts} />);

    const filterSelect = screen.getByDisplayValue(/all results/i);
    await user.selectOptions(filterSelect, 'passed');

    await waitFor(() => {
      expect(screen.getByText('Math 101 Midterm')).toBeInTheDocument();
      expect(screen.getByText('Math 101 Final')).toBeInTheDocument();
    });

    expect(screen.queryByText('Biology 102 Quiz')).not.toBeInTheDocument();
  });

  it('should filter attempts by failing status', async () => {
    const user = userEvent.setup();
    render(<ExamHistory attempts={mockAttempts} />);

    const statusSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(statusSelect, 'failed');

    await waitFor(() => {
      expect(screen.getByText('Biology 102 Quiz')).toBeInTheDocument();
    });
  });

  it('should sort attempts by newest first', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    const rows = screen.getAllByRole('row');
    // Newest attempt should be first (Math 101 Midterm - Feb 1)
    expect(rows[1]).toHaveTextContent('Math 101 Midterm');
  });

  it('should sort attempts by highest score', async () => {
    const user = userEvent.setup();
    render(<ExamHistory attempts={mockAttempts} />);

    const sortSelect = screen.getAllByRole('combobox')[3];
    await user.selectOptions(sortSelect, 'score');

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Highest score first (Math 101 Final - 92%)
      expect(rows[1]).toHaveTextContent('Math 101 Final');
    });
  });

  it('should display time spent formatted correctly', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    expect(screen.getByText('45m')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('should display score percentage', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('should call onReview when review button is clicked', async () => {
    const onReview = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamHistory attempts={mockAttempts} onReview={onReview} />
    );

    const reviewButtons = screen.getAllByRole('button', { name: /review/i });
    await user.click(reviewButtons[0]);

    expect(onReview).toHaveBeenCalledWith('attempt-1');
  });

  it('should call onRetake when retake button is clicked', async () => {
    const onRetake = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamHistory attempts={mockAttempts} onRetake={onRetake} />
    );

    const retakeButtons = screen.getAllByRole('button', { name: /retake/i });
    await user.click(retakeButtons[0]);

    expect(onRetake).toHaveBeenCalledWith('attempt-1');
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ExamHistory attempts={mockAttempts} onDelete={onDelete} />
    );

    // Mock the confirm dialog
    global.confirm = vi.fn(() => true);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('attempt-1');
  });

  it('should show "no exam attempts found" when list is empty', () => {
    render(<ExamHistory attempts={[]} />);

    expect(screen.getByText(/no exam attempts found/i)).toBeInTheDocument();
  });

  it('should display correct/total questions answered', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('6/10')).toBeInTheDocument();
    expect(screen.getByText('18/20')).toBeInTheDocument();
  });

  it('should calculate and display average score', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    const avgScore = (85 + 65 + 92) / 3;
    expect(screen.getByText(`${avgScore.toFixed(1)}%`)).toBeInTheDocument();
  });

  it('should calculate and display pass rate', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    const passRate = (2 / 3) * 100;
    expect(screen.getByText(`${passRate.toFixed(0)}%`)).toBeInTheDocument();
  });

  it('should disable action buttons when loading', () => {
    render(
      <ExamHistory attempts={mockAttempts} isLoading={true} />
    );

    const allButtons = screen.getAllByRole('button', {
      name: /(review|retake|delete)/i,
    });

    allButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should confirm before deleting', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    global.confirm = vi.fn(() => false); // User cancels

    render(
      <ExamHistory attempts={mockAttempts} onDelete={onDelete} />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should filter by date range (last week)', async () => {
    const user = userEvent.setup();
    const lastWeek = mockAttempts.filter(
      a => new Date(a.attempted_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    render(<ExamHistory attempts={mockAttempts} />);

    const dateSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(dateSelect, 'week');

    // Should show attempts from last week only
    await waitFor(() => {
      expect(screen.getByText('Math 101 Midterm')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', () => {
    render(<ExamHistory attempts={mockAttempts} />);

    // Date should be displayed in readable format
    expect(screen.getByText(/feb/i)).toBeInTheDocument();
  });
});
