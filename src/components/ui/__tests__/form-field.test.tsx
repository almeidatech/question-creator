import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '../form-field';
import { Input } from '../input';

describe('FormField', () => {
  describe('Rendering', () => {
    it('renders form field container', () => {
      render(
        <FormField htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(
        <FormField label="Email" htmlFor="email-input">
          <Input id="email-input" />
        </FormField>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder in child input', () => {
      render(
        <FormField htmlFor="test-input">
          <Input id="test-input" placeholder="Enter text" />
        </FormField>
      );
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(
        <FormField variant="default" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('renders error variant', () => {
      render(
        <FormField
          variant="error"
          errorMessage="This field is required"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(
        <FormField variant="success" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays error message when variant is error', () => {
      render(
        <FormField
          variant="error"
          errorMessage="Email is invalid"
          htmlFor="email-input"
        >
          <Input id="email-input" type="email" />
        </FormField>
      );
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    it('does not display error message when variant is not error', () => {
      render(
        <FormField
          variant="default"
          errorMessage="Email is invalid"
          htmlFor="email-input"
        >
          <Input id="email-input" type="email" />
        </FormField>
      );
      expect(screen.queryByText('Email is invalid')).not.toBeInTheDocument();
    });

    it('shows error message with correct role', () => {
      render(
        <FormField
          variant="error"
          errorMessage="Field error"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      const errorElement = screen.getByText('Field error');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('sets aria-invalid on container when error variant', () => {
      const { container } = render(
        <FormField
          variant="error"
          errorMessage="Error"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      const childContainer = container.querySelector('[aria-invalid="true"]');
      expect(childContainer).toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(
        <FormField helperText="Min 8 characters" htmlFor="password-input">
          <Input id="password-input" type="password" />
        </FormField>
      );
      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
    });

    it('does not show helper text when error variant and error message exist', () => {
      render(
        <FormField
          variant="error"
          errorMessage="Error message"
          helperText="Helper text"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('shows helper text with non-error variant', () => {
      render(
        <FormField
          variant="default"
          helperText="This is helper text"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });
  });

  describe('Required Indicator', () => {
    it('shows required asterisk when required prop is true', () => {
      render(
        <FormField
          label="Email"
          required
          htmlFor="email-input"
        >
          <Input id="email-input" />
        </FormField>
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show asterisk when required is false', () => {
      render(
        <FormField label="Optional Field" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('marks asterisk as hidden from screen readers', () => {
      render(
        <FormField
          label="Email"
          required
          htmlFor="email-input"
        >
          <Input id="email-input" />
        </FormField>
      );
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Label Association', () => {
    it('associates label with input via htmlFor', () => {
      render(
        <FormField label="Email" htmlFor="email-input">
          <Input id="email-input" type="email" />
        </FormField>
      );
      const label = screen.getByText('Email').closest('label');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('does not render label when label prop is not provided', () => {
      render(
        <FormField htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-describedby for error message', () => {
      const { container } = render(
        <FormField
          variant="error"
          errorMessage="Invalid input"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      const describedElement = container.querySelector('[aria-describedby="test-input-error"]');
      expect(describedElement).toBeInTheDocument();
    });

    it('sets aria-describedby for helper text', () => {
      const { container } = render(
        <FormField
          helperText="Helper text here"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      const describedElement = container.querySelector('[aria-describedby="test-input-helper"]');
      expect(describedElement).toBeInTheDocument();
    });

    it('has proper semantic HTML structure', () => {
      const { container } = render(
        <FormField label="Test" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      const formField = container.firstChild;
      expect(formField).toHaveClass('w-full');
    });

    it('maintains focus management with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <FormField label="Input" htmlFor="test-input">
          <Input id="test-input" type="text" />
        </FormField>
      );
      const input = screen.getByRole('textbox');
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple form elements', () => {
      render(
        <FormField label="Form Group" htmlFor="test-group">
          <div id="test-group">
            <Input type="text" placeholder="First input" />
            <Input type="text" placeholder="Second input" />
          </div>
        </FormField>
      );
      expect(screen.getByPlaceholderText('First input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Second input')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FormField className="custom-class" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      const formFieldDiv = container.firstChild;
      expect(formFieldDiv).toHaveClass('custom-class');
    });

    it('always applies base width class', () => {
      const { container } = render(
        <FormField htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      const formFieldDiv = container.firstChild;
      expect(formFieldDiv).toHaveClass('w-full');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <FormField ref={ref} htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('allows programmatic access to form field DOM', () => {
      const ref = { current: null };
      render(
        <FormField ref={ref} htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      expect(ref.current?.querySelector('input')).toBeInTheDocument();
    });
  });

  describe('Error State Styling', () => {
    it('applies error color to label', () => {
      render(
        <FormField
          label="Error Field"
          variant="error"
          htmlFor="test-input"
        >
          <Input id="test-input" />
        </FormField>
      );
      const label = screen.getByText('Error Field');
      expect(label).toHaveClass('text-error-600');
    });

    it('applies default color to label when not error', () => {
      render(
        <FormField label="Normal Field" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );
      const label = screen.getByText('Normal Field');
      expect(label).toHaveClass('text-neutral-700');
    });
  });
});
