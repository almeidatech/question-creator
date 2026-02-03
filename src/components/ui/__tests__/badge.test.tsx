import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders badge with text', () => {
      const { container } = render(<Badge>New</Badge>);
      expect(container.textContent).toBe('New');
    });

    it('renders with default variant (primary)', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
    });

    it('renders with default size (md)', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'success', 'error', 'warning', 'info', 'neutral'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        const { container } = render(<Badge variant={variant}>Badge</Badge>);
        const badge = container.firstChild as HTMLElement;

        const expectedClasses = {
          primary: ['bg-primary-100', 'text-primary-800'],
          success: ['bg-success-100', 'text-success-800'],
          error: ['bg-error-100', 'text-error-800'],
          warning: ['bg-warning-100', 'text-warning-800'],
          info: ['bg-info-100', 'text-info-800'],
          neutral: ['bg-neutral-200', 'text-neutral-800'],
        };

        expectedClasses[variant].forEach((cls) => {
          expect(badge).toHaveClass(cls);
        });
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.firstChild).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('renders medium size (default)', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      expect(container.firstChild).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('renders large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      expect(container.firstChild).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Badge className="custom-class">Badge</Badge>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts data attributes', () => {
      const { container } = render(
        <Badge data-testid="badge-test">Badge</Badge>
      );
      expect(container.querySelector('[data-testid="badge-test"]')).toBeInTheDocument();
    });

    it('accepts aria attributes', () => {
      const { container } = render(
        <Badge role="status" aria-label="New item">
          New
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label', 'New item');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Badge</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });
});

