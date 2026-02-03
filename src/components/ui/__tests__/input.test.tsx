import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" id="email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Input variant="default" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-neutral-300');
    });

    it('renders error variant', () => {
      render(<Input variant="error" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-error-500');
    });

    it('renders success variant', () => {
      render(<Input variant="success" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-success-500');
    });
  });

  describe('Error Messages', () => {
    it('displays error message', () => {
      render(
        <Input
          variant="error"
          errorMessage="Email is invalid"
          id="email"
        />
      );
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    it('sets aria-invalid when error', () => {
      render(
        <Input
          variant="error"
          errorMessage="Error"
          id="email"
        />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not display error message by default', () => {
      render(<Input />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(<Input helperText="Min 8 characters" id="password" />);
      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
    });

    it('does not show error and helper text together', () => {
      render(
        <Input
          variant="error"
          errorMessage="Error message"
          helperText="Helper text"
          id="email"
        />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Required Field', () => {
    it('shows required indicator', () => {
      render(<Input label="Email" required id="email" />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('sets required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('required');
    });
  });

  describe('Input Types', () => {
    const types = ['text', 'email', 'password', 'number', 'search', 'url', 'tel'];

    types.forEach((type) => {
      it(`renders ${type} input type`, () => {
        render(<Input type={type} />);
        expect(screen.getByRole('textbox', { hidden: type === 'password' })).toHaveAttribute(
          'type',
          type
        );
      });
    });
  });

  describe('States', () => {
    it('disables input when disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('accepts value prop', () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles onChange event', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles focus and blur events', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalled();

      await userEvent.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Email" id="email" />);
      const label = screen.getByText('Email').closest('label');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('sets aria-describedby for error messages', () => {
      render(
        <Input
          id="email"
          variant="error"
          errorMessage="Invalid email"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('sets aria-describedby for helper text', () => {
      render(
        <Input
          id="password"
          helperText="Min 8 characters"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'password-helper');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});

