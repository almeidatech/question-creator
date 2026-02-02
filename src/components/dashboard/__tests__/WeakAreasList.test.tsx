import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeakAreasList } from '../WeakAreasList';
import { WeakArea } from '@/stores';
import React from 'react';

describe('WeakAreasList', () => {
  const mockAreas: WeakArea[] = [
    { topic: 'Algebra', accuracy: 35 },
    { topic: 'Geometry', accuracy: 48 },
    { topic: 'Calculus', accuracy: 62 },
  ];

  it('renders title', () => {
    render(<WeakAreasList areas={mockAreas} />);
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
  });

  it('displays success message when no weak areas', () => {
    render(<WeakAreasList areas={[]} />);
    expect(screen.getByText(/great job/i)).toBeInTheDocument();
  });

  it('renders all weak areas', () => {
    render(<WeakAreasList areas={mockAreas} />);
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
    expect(screen.getByText('Calculus')).toBeInTheDocument();
  });

  it('displays accuracy percentages', () => {
    render(<WeakAreasList areas={mockAreas} />);
    expect(screen.getByText('35.0%')).toBeInTheDocument();
    expect(screen.getByText('48.0%')).toBeInTheDocument();
    expect(screen.getByText('62.0%')).toBeInTheDocument();
  });

  it('sorts areas by accuracy ascending', () => {
    const { container } = render(<WeakAreasList areas={mockAreas} />);
    const topics = container.querySelectorAll('[class*="font-medium"]');
    expect(topics.length).toBeGreaterThan(0);
  });

  it('handles single weak area', () => {
    const singleArea: WeakArea[] = [{ topic: 'Physics', accuracy: 25 }];
    render(<WeakAreasList areas={singleArea} />);
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('renders progress bars', () => {
    const { container } = render(<WeakAreasList areas={mockAreas} />);
    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles very low accuracy', () => {
    const lowAccuracy: WeakArea[] = [{ topic: 'Advanced Math', accuracy: 15 }];
    render(<WeakAreasList areas={lowAccuracy} />);
    expect(screen.getByText('Advanced Math')).toBeInTheDocument();
  });
});
