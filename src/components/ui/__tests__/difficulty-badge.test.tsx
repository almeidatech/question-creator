import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { DifficultyBadge } from '../difficulty-badge';
import { DIFFICULTY_LEVELS } from '../badge-utils';

describe('DifficultyBadge', () => {
  describe('Rendering', () => {
    it('renders difficulty badge with easy level', () => {
      render(<DifficultyBadge difficulty="easy" />);
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('renders difficulty badge with medium level', () => {
      render(<DifficultyBadge difficulty="medium" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('renders difficulty badge with hard level', () => {
      render(<DifficultyBadge difficulty="hard" />);
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('renders difficulty badge with expert level', () => {
      render(<DifficultyBadge difficulty="expert" />);
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(
        <DifficultyBadge difficulty="easy" size="sm" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-xs');
    });

    it('renders with medium size (default)', () => {
      const { container } = render(<DifficultyBadge difficulty="easy" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-sm');
    });

    it('renders with large size', () => {
      const { container } = render(
        <DifficultyBadge difficulty="easy" size="lg" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-base');
    });
  });

  describe('Icon Display', () => {
    it('displays icon by default', () => {
      const { container } = render(<DifficultyBadge difficulty="medium" />);
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('does not display icon when showIcon is false', () => {
      const { container } = render(
        <DifficultyBadge difficulty="medium" showIcon={false} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).not.toBeInTheDocument();
    });

    it('displays one star for easy difficulty', () => {
      const { container } = render(
        <DifficultyBadge difficulty="easy" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('displays two stars for medium difficulty', () => {
      const { container } = render(
        <DifficultyBadge difficulty="medium" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('displays three stars for hard difficulty', () => {
      const { container } = render(
        <DifficultyBadge difficulty="hard" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('displays four stars for expert difficulty', () => {
      const { container } = render(
        <DifficultyBadge difficulty="expert" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    it('displays label by default', () => {
      render(<DifficultyBadge difficulty="hard" />);
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('displays label when showLabel is true', () => {
      render(<DifficultyBadge difficulty="hard" showLabel={true} />);
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<DifficultyBadge difficulty="hard" showLabel={false} />);
      expect(screen.queryByText('Hard')).not.toBeInTheDocument();
    });

    it('shows label and icon together', () => {
      const { container } = render(
        <DifficultyBadge difficulty="medium" showIcon={true} showLabel={true} />
      );
      expect(screen.getByText('Medium')).toBeInTheDocument();
      const iconSpan = container.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('shows icon only without label', () => {
      const { container } = render(
        <DifficultyBadge difficulty="hard" showIcon={true} showLabel={false} />
      );
      expect(screen.queryByText('Hard')).not.toBeInTheDocument();
      const iconSpan = container.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('Color Mapping', () => {
    it('applies success color classes for easy level', () => {
      const { container } = render(<DifficultyBadge difficulty="easy" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-success-100');
      expect(badge.className).toContain('text-success-800');
    });

    it('applies warning color classes for medium level', () => {
      const { container } = render(<DifficultyBadge difficulty="medium" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-warning-100');
      expect(badge.className).toContain('text-warning-800');
    });

    it('applies error color classes for hard level', () => {
      const { container } = render(<DifficultyBadge difficulty="hard" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-error-100');
      expect(badge.className).toContain('text-error-800');
    });

    it('applies primary color classes for expert level', () => {
      const { container } = render(<DifficultyBadge difficulty="expert" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-primary-100');
      expect(badge.className).toContain('text-primary-800');
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen reader awareness', () => {
      render(<DifficultyBadge difficulty="hard" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('includes aria-label describing the difficulty', () => {
      render(<DifficultyBadge difficulty="hard" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Hard difficulty level, 3 out of 4 difficulty stars'
      );
    });

    it('includes aria-label for easy difficulty', () => {
      render(<DifficultyBadge difficulty="easy" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Easy difficulty level, 1 out of 4 difficulty stars'
      );
    });

    it('includes aria-label for expert difficulty', () => {
      render(<DifficultyBadge difficulty="expert" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Expert difficulty level, 4 out of 4 difficulty stars'
      );
    });

    it('has data-difficulty attribute for testing', () => {
      render(<DifficultyBadge difficulty="expert" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('data-difficulty', 'expert');
    });

    it('icon span has aria-hidden for semantic correctness', () => {
      const { container } = render(
        <DifficultyBadge difficulty="hard" showIcon={true} />
      );
      const iconSpan = container.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLDivElement>();
      render(<DifficultyBadge ref={ref} difficulty="easy" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toContain('Easy');
    });

    it('allows access to DOM element through ref', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <DifficultyBadge ref={ref} difficulty="hard" className="custom-class" />
      );
      expect(ref.current?.className).toContain('custom-class');
    });
  });

  describe('Props Integration', () => {
    it('accepts and applies custom className', () => {
      const { container } = render(
        <DifficultyBadge difficulty="easy" className="custom-class" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('custom-class');
    });

    it('accepts and applies data attributes', () => {
      const { container } = render(
        <DifficultyBadge difficulty="easy" data-testid="difficulty-badge" />
      );
      const badge = container.querySelector('[data-testid="difficulty-badge"]');
      expect(badge).toBeInTheDocument();
    });

    it('combines all props correctly', () => {
      render(
        <DifficultyBadge
          difficulty="expert"
          size="lg"
          showIcon={true}
          showLabel={true}
          className="test-class"
        />
      );
      expect(screen.getByText('Expert')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('test-class');
    });

    it('defaults showIcon to true', () => {
      const { container } = render(<DifficultyBadge difficulty="medium" />);
      const iconSpan = container.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('defaults showLabel to true', () => {
      render(<DifficultyBadge difficulty="medium" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(DifficultyBadge.displayName).toBe('DifficultyBadge');
    });
  });
});

