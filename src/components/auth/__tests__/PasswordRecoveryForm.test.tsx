import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordRecoveryForm } from '../PasswordRecoveryForm';
import React from 'react';

global.fetch = vi.fn();

describe('PasswordRecoveryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password recovery form', () => {
    render(<PasswordRecoveryForm />);
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows verification code input after requesting code', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const requestButton = screen.getByText(/send verification code/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });

  it('requires verification code', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const requestButton = screen.getByText(/send verification code/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(requestButton);

    await waitFor(() => {
      const codeInput = screen.getByPlaceholderText('000000') as HTMLInputElement;
      fireEvent.change(codeInput, { target: { value: '123' } });
      fireEvent.blur(codeInput);

      expect(screen.getByText(/verification code must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('validates new passwords match', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const requestButton = screen.getByText(/send verification code/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(requestButton);

    await waitFor(() => {
      const codeInput = screen.getByPlaceholderText('000000') as HTMLInputElement;
      fireEvent.change(codeInput, { target: { value: '123456' } });
    });

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Password456' } });

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows back button in recovery step', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const requestButton = screen.getByText(/send verification code/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/back/i)).toBeInTheDocument();
    });
  });

  it('disables email input after requesting code', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<PasswordRecoveryForm />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const requestButton = screen.getByText(/send verification code/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
    });
  });

  it('links to login page', () => {
    render(<PasswordRecoveryForm />);
    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });
});
