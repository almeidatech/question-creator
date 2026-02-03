import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Layout } from '../Layout';
import { useAuthStore } from '@/stores';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Layout', () => {
  it('renders without errors', () => {
    render(
      <Layout requireAuth={false}>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays main content', () => {
    render(
      <Layout requireAuth={false}>
        <div>Main Content</div>
      </Layout>
    );
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('renders header with logo', () => {
    render(
      <Layout requireAuth={false}>
        <div>Content</div>
      </Layout>
    );
    expect(screen.getByText('Q-Creator')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <Layout requireAuth={false}>
        <div>Content</div>
      </Layout>
    );
    expect(screen.getByText(/Question Creator/i)).toBeInTheDocument();
  });
});

