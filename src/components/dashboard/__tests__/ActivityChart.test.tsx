import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityChart } from '../ActivityChart';
import { ActivityData } from '@/stores';
import React from 'react';

describe('ActivityChart', () => {
  const mockData: ActivityData[] = [
    { date: '2024-01-01', questions_answered: 5 },
    { date: '2024-01-02', questions_answered: 8 },
    { date: '2024-01-03', questions_answered: 6 },
    { date: '2024-01-04', questions_answered: 10 },
    { date: '2024-01-05', questions_answered: 7 },
  ];

  it('renders chart title', () => {
    render(<ActivityChart data={mockData} />);
    expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
  });

  it('renders message when no data', () => {
    render(<ActivityChart data={[]} />);
    expect(screen.getByText('No activity data available')).toBeInTheDocument();
  });

  it('renders line chart by default', () => {
    render(<ActivityChart data={mockData} type="line" />);
    expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
  });

  it('renders bar chart when type is bar', () => {
    render(<ActivityChart data={mockData} type="bar" />);
    expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
  });

  it('renders with chart data', () => {
    const { container } = render(<ActivityChart data={mockData} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const singleData: ActivityData[] = [
      { date: '2024-01-01', questions_answered: 5 },
    ];
    render(<ActivityChart data={singleData} />);
    expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
  });

  it('handles large dataset', () => {
    const largeData: ActivityData[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      questions_answered: Math.floor(Math.random() * 20),
    }));
    render(<ActivityChart data={largeData} />);
    expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
  });
});
