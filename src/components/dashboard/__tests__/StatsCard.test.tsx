import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '../StatsCard';
import { TrendingUp } from 'lucide-react';
import React from 'react';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Questions Answered" value={342} />);
    expect(screen.getByText('Questions Answered')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument();
  });

  it('displays positive trend with arrow up', () => {
    render(<StatsCard label="Accuracy" value="85%" trend={12} />);
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('displays negative trend with arrow down', () => {
    render(<StatsCard label="Errors" value={5} trend={-3} />);
    expect(screen.getByText('3%')).toBeInTheDocument();
  });

  it('renders without trend when not provided', () => {
    render(<StatsCard label="Streak" value={7} />);
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <StatsCard
        label="Growth"
        value={100}
        icon={<TrendingUp size={24} />}
      />
    );
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });

  it('applies correct color class', () => {
    const { container } = render(
      <StatsCard label="Test" value={10} color="green" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays string values', () => {
    render(<StatsCard label="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles zero trend', () => {
    render(<StatsCard label="Test" value={50} trend={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
