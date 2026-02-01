import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with default variant (primary)', () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'outline'] as const;

    variants.forEach((variant) => {
      it(`renders with ${variant} variant`, () => {
        render(<Button variant={variant}>Button</Button>);
        expect(screen.getByRole('button')).toHaveClass(`btn-${variant}`);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`renders with ${size} size`, () => {
        render(<Button size={size}>Button</Button>);
        expect(screen.getByRole('button')).toHaveClass(`btn-${size}`);
      });
    });
  });

  describe('States', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('disables button when loading', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click
        </Button>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} isLoading>
          Loading
        </Button>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('renders full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('does not render full width by default', () => {
      render(<Button>Normal</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('has proper role for button', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('is keyboard accessible', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for primary button', () => {
      const { container } = render(<Button>Primary</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading button', () => {
      const { container } = render(<Button isLoading>Loading</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
