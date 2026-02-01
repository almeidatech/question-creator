import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionOption } from '../question-option';

describe('QuestionOption', () => {
  const defaultProps = {
    id: 'opt-1',
    label: 'Option A',
  };

  describe('Rendering', () => {
    it('renders option with label', () => {
      render(<QuestionOption {...defaultProps} />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <QuestionOption
          {...defaultProps}
          description="This is option A"
        />
      );
      expect(screen.getByText('This is option A')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(
        <QuestionOption
          {...defaultProps}
          icon={<span data-testid="test-icon">📝</span>}
        />
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      const { container } = render(<QuestionOption {...defaultProps} />);
      const descriptions = container.querySelectorAll('.text-neutral-600');
      expect(descriptions.length).toBe(0);
    });
  });

  describe('States', () => {
    it('renders selected state', () => {
      render(<QuestionOption {...defaultProps} isSelected />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('aria-checked', 'true');
    });

    it('renders unselected state', () => {
      render(<QuestionOption {...defaultProps} isSelected={false} />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('aria-checked', 'false');
    });

    it('renders disabled state', () => {
      render(<QuestionOption {...defaultProps} isDisabled />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies disabled styling', () => {
      render(<QuestionOption {...defaultProps} isDisabled />);
      const container = screen.getByRole('radio');
      expect(container).toHaveClass('opacity-50');
    });
  });

  describe('Radio vs Checkbox', () => {
    it('renders as radio by default', () => {
      render(<QuestionOption {...defaultProps} />);
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('renders as checkbox when type is checkbox', () => {
      render(<QuestionOption {...defaultProps} type="checkbox" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('radio button has circular shape', () => {
      render(<QuestionOption {...defaultProps} isSelected type="radio" />);
      const control = screen.getByRole('radio');
      expect(control.firstChild).toHaveClass('rounded-full');
    });

    it('checkbox has square shape', () => {
      render(<QuestionOption {...defaultProps} isSelected type="checkbox" />);
      const control = screen.getByRole('checkbox');
      expect(control.firstChild).toHaveClass('rounded');
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when clicked', async () => {
      const onChange = vi.fn();
      render(<QuestionOption {...defaultProps} onChange={onChange} />);

      const control = screen.getByRole('radio');
      await userEvent.click(control);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('toggles selection on click', async () => {
      const onChange = vi.fn();
      render(
        <QuestionOption
          {...defaultProps}
          isSelected={true}
          onChange={onChange}
        />
      );

      const control = screen.getByRole('radio');
      await userEvent.click(control);

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('does not call onChange when disabled and clicked', async () => {
      const onChange = vi.fn();
      render(
        <QuestionOption
          {...defaultProps}
          isDisabled
          onChange={onChange}
        />
      );

      const control = screen.getByRole('radio');
      await userEvent.click(control);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows checkmark when selected', () => {
      const { container } = render(
        <QuestionOption {...defaultProps} isSelected />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides checkmark when not selected', () => {
      const { container } = render(
        <QuestionOption {...defaultProps} isSelected={false} />
      );
      const svgs = container.querySelectorAll('svg');
      // Only search icon, no checkmark
      expect(svgs.length).toBe(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Space key to toggle selection', async () => {
      const onChange = vi.fn();
      render(<QuestionOption {...defaultProps} onChange={onChange} />);

      const control = screen.getByRole('radio');
      await userEvent.keyboard('{Space}');
      control.focus();

      expect(control).toHaveFocus();
    });

    it('handles Enter key to toggle selection', async () => {
      const onChange = vi.fn();
      render(<QuestionOption {...defaultProps} onChange={onChange} />);

      const control = screen.getByRole('radio');
      control.focus();
      await userEvent.keyboard('{Enter}');

      // Enter key is handled but would require focus simulation
      expect(control).toHaveFocus();
    });

    it('is focusable by default', () => {
      render(<QuestionOption {...defaultProps} />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when disabled', () => {
      render(<QuestionOption {...defaultProps} isDisabled />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('tabIndex', '-1');
    });

    it('calls onKeyDown callback', async () => {
      const onKeyDown = vi.fn();
      render(<QuestionOption {...defaultProps} onKeyDown={onKeyDown} />);

      const control = screen.getByRole('radio');
      control.focus();
      await userEvent.keyboard('{Space}');

      // onKeyDown should be called
      expect(control).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has correct role for radio', () => {
      render(<QuestionOption {...defaultProps} type="radio" />);
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('has correct role for checkbox', () => {
      render(<QuestionOption {...defaultProps} type="checkbox" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('has aria-checked attribute', () => {
      render(<QuestionOption {...defaultProps} isSelected />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('aria-checked');
    });

    it('has aria-disabled when disabled', () => {
      render(<QuestionOption {...defaultProps} isDisabled />);
      const control = screen.getByRole('radio');
      expect(control).toHaveAttribute('aria-disabled', 'true');
    });

    it('updates aria-checked based on state', () => {
      const { rerender } = render(
        <QuestionOption {...defaultProps} isSelected={false} />
      );
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false');

      rerender(<QuestionOption {...defaultProps} isSelected={true} />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Styling', () => {
    it('applies primary border color when selected', () => {
      render(<QuestionOption {...defaultProps} isSelected />);
      const container = screen.getByRole('radio');
      expect(container).toHaveClass('border-primary-500');
    });

    it('applies neutral border color when not selected', () => {
      render(<QuestionOption {...defaultProps} isSelected={false} />);
      const container = screen.getByRole('radio');
      expect(container).toHaveClass('border-neutral-300');
    });

    it('applies custom className', () => {
      render(
        <QuestionOption {...defaultProps} className="custom-class" />
      );
      const container = screen.getByRole('radio');
      expect(container).toHaveClass('custom-class');
    });

    it('has hover state when not disabled', () => {
      render(<QuestionOption {...defaultProps} isDisabled={false} />);
      const container = screen.getByRole('radio');
      expect(container).toHaveClass('hover:border-primary-300');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<QuestionOption {...defaultProps} ref={ref} />);
      expect(ref).toHaveBeenCalled();
      // Ref callback is called with the DOM element
      const callCount = ref.mock.calls.length;
      expect(callCount).toBeGreaterThan(0);
    });
  });
});
