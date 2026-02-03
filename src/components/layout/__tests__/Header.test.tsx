import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import React from 'react';

describe('Header', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'John Doe',
    user_role: 'student',
    subscription_tier: 'free',
    avatar_url: null,
    is_active: true,
  };

  const mockLogout = vi.fn();

  it('renders header with logo', () => {
    render(<Header user={null} onLogout={mockLogout} />);
    expect(screen.getByText('Q-Creator')).toBeInTheDocument();
  });

  it('displays user first name when logged in', () => {
    render(<Header user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('displays user email when logged in', () => {
    render(<Header user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls logout when logout button clicked', () => {
    render(<Header user={mockUser} onLogout={mockLogout} />);
    const logoutButton = screen.getByLabelText('Logout');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders theme toggle button', () => {
    render(<Header user={null} onLogout={mockLogout} />);
    const themeButton = screen.getByLabelText(/toggle dark mode/i);
    expect(themeButton).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<Header user={null} onLogout={mockLogout} />);
    const menuButton = screen.getByLabelText(/toggle sidebar/i);
    expect(menuButton).toBeInTheDocument();
  });
});

