import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('requires password', async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', async () => {
    render(<LoginForm />);
    const submitButton = screen.getByText(/sign in/i) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('enables submit button when form is valid', async () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    const submitButton = screen.getByText(/sign in/i) as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it('toggles password visibility', async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(passwordInput.type).toBe('text');
    });
  });

  it('renders remember me checkbox', () => {
    render(<LoginForm />);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeInTheDocument();
  });

  it('links to signup page', () => {
    render(<LoginForm />);
    const signupLink = screen.getByText(/sign up/i);
    expect(signupLink).toHaveAttribute('href', '/auth/signup');
  });
});
