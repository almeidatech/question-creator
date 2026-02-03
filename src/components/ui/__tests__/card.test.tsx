import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'border', 'border-neutral-200', 'shadow-sm');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-white', 'border', 'shadow-sm');
    });

    it('renders elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
    });

    it('renders outlined variant', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      expect(container.firstChild).toHaveClass('border-2', 'border-neutral-300', 'bg-neutral-50');
    });
  });

  describe('Padding', () => {
    it('renders with no padding', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      expect(container.firstChild).not.toHaveClass('p-');
    });

    it('renders with small padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      expect(container.firstChild).toHaveClass('p-3');
    });

    it('renders with medium padding (default)', () => {
      const { container } = render(<Card padding="md">Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('renders with large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });
  });

  describe('Combination', () => {
    it('combines variant and padding correctly', () => {
      const { container } = render(
        <Card variant="elevated" padding="lg">
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'shadow-md', 'p-6');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('HTML Attributes', () => {
    it('accepts standard HTML attributes', () => {
      render(
        <Card data-testid="card" role="region">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'region');
    });
  });
});

