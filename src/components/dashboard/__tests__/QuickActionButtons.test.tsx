import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionButtons } from '../QuickActionButtons';
import React from 'react';

describe('QuickActionButtons', () => {
  it('renders all action buttons', () => {
    render(<QuickActionButtons />);
    expect(screen.getByText('Generate Questions')).toBeInTheDocument();
    expect(screen.getByText('Create Exam')).toBeInTheDocument();
    expect(screen.getByText('Review History')).toBeInTheDocument();
  });

  it('calls onGenerate when Generate button clicked', () => {
    const mockGenerate = vi.fn();
    render(<QuickActionButtons onGenerate={mockGenerate} />);
    const generateButton = screen.getByText('Generate Questions');
    fireEvent.click(generateButton);
    expect(mockGenerate).toHaveBeenCalled();
  });

  it('calls onCreateExam when Create Exam button clicked', () => {
    const mockCreateExam = vi.fn();
    render(<QuickActionButtons onCreateExam={mockCreateExam} />);
    const createButton = screen.getByText('Create Exam');
    fireEvent.click(createButton);
    expect(mockCreateExam).toHaveBeenCalled();
  });

  it('calls onReview when Review History button clicked', () => {
    const mockReview = vi.fn();
    render(<QuickActionButtons onReview={mockReview} />);
    const reviewButton = screen.getByText('Review History');
    fireEvent.click(reviewButton);
    expect(mockReview).toHaveBeenCalled();
  });

  it('handles multiple button clicks', () => {
    const mockGenerate = vi.fn();
    const mockCreateExam = vi.fn();
    const mockReview = vi.fn();

    render(
      <QuickActionButtons
        onGenerate={mockGenerate}
        onCreateExam={mockCreateExam}
        onReview={mockReview}
      />
    );

    fireEvent.click(screen.getByText('Generate Questions'));
    fireEvent.click(screen.getByText('Create Exam'));
    fireEvent.click(screen.getByText('Review History'));

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockCreateExam).toHaveBeenCalledTimes(1);
    expect(mockReview).toHaveBeenCalledTimes(1);
  });

  it('renders with proper styling', () => {
    const { container } = render(<QuickActionButtons />);
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
  });
});
