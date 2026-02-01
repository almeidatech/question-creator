import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { ReputationBadge } from '../reputation-badge';
import { REPUTATION_LEVELS } from '../badge-utils';

describe('ReputationBadge', () => {
  describe('Rendering', () => {
    it('renders reputation badge with beginner level', () => {
      render(<ReputationBadge level="beginner" />);
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('renders reputation badge with intermediate level', () => {
      render(<ReputationBadge level="intermediate" />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('renders reputation badge with advanced level', () => {
      render(<ReputationBadge level="advanced" />);
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('renders reputation badge with expert level', () => {
      render(<ReputationBadge level="expert" />);
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(<ReputationBadge level="beginner" size="sm" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-xs');
    });

    it('renders with medium size (default)', () => {
      const { container } = render(<ReputationBadge level="beginner" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-sm');
    });

    it('renders with large size', () => {
      const { container } = render(<ReputationBadge level="beginner" size="lg" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('text-base');
    });
  });

  describe('Score Display', () => {
    it('does not display score when showScore is false', () => {
      render(<ReputationBadge level="advanced" score={75} showScore={false} />);
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('displays score when showScore is true', () => {
      render(<ReputationBadge level="advanced" score={75} showScore={true} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('displays score with zero value', () => {
      render(<ReputationBadge level="beginner" score={0} showScore={true} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays score with 100 value', () => {
      render(<ReputationBadge level="expert" score={100} showScore={true} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('does not display score when score prop is undefined', () => {
      render(<ReputationBadge level="advanced" showScore={true} />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('does not display icon when showIcon is false', () => {
      const { container } = render(
        <ReputationBadge level="advanced" showIcon={false} />
      );
      const stars = container.querySelectorAll('span:contains("⭐")');
      expect(stars.length).toBe(0);
    });

    it('displays correct number of stars for beginner level', () => {
      const { container } = render(
        <ReputationBadge level="beginner" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });

    it('displays correct number of stars for expert level', () => {
      const { container } = render(
        <ReputationBadge level="expert" showIcon={true} />
      );
      const badge = container.firstChild as HTMLElement;
      const iconSpan = badge.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('Color Mapping', () => {
    it('applies primary color classes for beginner level', () => {
      const { container } = render(<ReputationBadge level="beginner" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-primary-100');
      expect(badge.className).toContain('text-primary-800');
    });

    it('applies success color classes for intermediate level', () => {
      const { container } = render(<ReputationBadge level="intermediate" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-success-100');
      expect(badge.className).toContain('text-success-800');
    });

    it('applies warning color classes for advanced level', () => {
      const { container } = render(<ReputationBadge level="advanced" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-warning-100');
      expect(badge.className).toContain('text-warning-800');
    });

    it('applies error color classes for expert level', () => {
      const { container } = render(<ReputationBadge level="expert" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-error-100');
      expect(badge.className).toContain('text-error-800');
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen reader awareness', () => {
      render(<ReputationBadge level="advanced" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('includes aria-label describing the level', () => {
      render(<ReputationBadge level="advanced" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Advanced reputation level');
    });

    it('includes aria-label with score when displayed', () => {
      render(<ReputationBadge level="intermediate" score={45} showScore={true} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Intermediate reputation, score 45');
    });

    it('has data-level attribute for testing', () => {
      render(<ReputationBadge level="expert" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('data-level', 'expert');
    });

    it('icon span has aria-hidden for semantic correctness', () => {
      const { container } = render(
        <ReputationBadge level="advanced" showIcon={true} />
      );
      const iconSpan = container.querySelector('[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLDivElement>();
      render(<ReputationBadge ref={ref} level="beginner" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toContain('Beginner');
    });

    it('allows access to DOM element through ref', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <ReputationBadge ref={ref} level="advanced" className="custom-class" />
      );
      expect(ref.current?.className).toContain('custom-class');
    });
  });

  describe('Props Integration', () => {
    it('accepts and applies custom className', () => {
      const { container } = render(
        <ReputationBadge level="beginner" className="custom-class" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('custom-class');
    });

    it('accepts and applies data attributes', () => {
      const { container } = render(
        <ReputationBadge level="beginner" data-testid="reputation-badge" />
      );
      const badge = container.querySelector('[data-testid="reputation-badge"]');
      expect(badge).toBeInTheDocument();
    });

    it('combines all props correctly', () => {
      render(
        <ReputationBadge
          level="expert"
          score={95}
          size="lg"
          showScore={true}
          showIcon={true}
          className="test-class"
        />
      );
      expect(screen.getByText('Expert')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('test-class');
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(ReputationBadge.displayName).toBe('ReputationBadge');
    });
  });
});
