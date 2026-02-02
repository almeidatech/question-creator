import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignupForm } from '../SignupForm';
import React from 'react';

global.fetch = vi.fn();

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form', () => {
    render(<SignupForm />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SignupForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('validates password strength requirements', async () => {
    render(<SignupForm />);
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0] as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('requires uppercase letter in password', async () => {
    render(<SignupForm />);
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0] as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one uppercase letter/i)
      ).toBeInTheDocument();
    });
  });

  it('validates passwords match', async () => {
    render(<SignupForm />);
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    const confirmInput = passwordInputs[1] as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'Password456' } });
    fireEvent.blur(confirmInput);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('requires ToS agreement', () => {
    render(<SignupForm />);
    const tosCheckbox = screen.getByLabelText(/terms of service/i);
    expect(tosCheckbox).toBeInTheDocument();
  });

  it('disables submit button until form valid and ToS checked', async () => {
    render(<SignupForm />);
    const submitButton = screen.getByText(/create account/i) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    const confirmInput = passwordInputs[1] as HTMLInputElement;
    const tosCheckbox = screen.getByLabelText(/terms of service/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'Password123' } });
    fireEvent.click(tosCheckbox);

    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it('shows password strength indicator', async () => {
    render(<SignupForm />);
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0] as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });

    await waitFor(() => {
      expect(screen.getByText(/strong|very strong/i)).toBeInTheDocument();
    });
  });

  it('links to login page', () => {
    render(<SignupForm />);
    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });
});
