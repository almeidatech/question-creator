import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import React from 'react';

describe('Sidebar', () => {
  it('renders all navigation links', () => {
    render(<Sidebar currentRoute="/dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Exams')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(<Sidebar currentRoute="/dashboard" />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-blue-50');
  });

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar currentRoute="/" />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Questions').closest('a')).toHaveAttribute('href', '/questions');
    expect(screen.getByText('Exams').closest('a')).toHaveAttribute('href', '/exams');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('renders close button for mobile', () => {
    render(<Sidebar currentRoute="/" />);
    const closeButton = screen.getByLabelText(/close sidebar/i);
    expect(closeButton).toBeInTheDocument();
  });
});

