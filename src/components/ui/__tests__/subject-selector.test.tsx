import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectSelector } from '../subject-selector';

describe('SubjectSelector', () => {
  describe('Rendering', () => {
    it('renders subject selector component', () => {
      render(<SubjectSelector />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders with default label', () => {
      render(<SubjectSelector />);
      expect(screen.getByText('Select Subjects')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<SubjectSelector label="Pick Technologies" />);
      expect(screen.getByText('Pick Technologies')).toBeInTheDocument();
    });

    it('shows message when no domain selected', () => {
      render(<SubjectSelector />);
      expect(screen.getByText(/Select a domain first/)).toBeInTheDocument();
    });
  });

  describe('Domain Filtering', () => {
    it('renders subjects for selected domain', () => {
      render(<SubjectSelector domain="frontend" />);
      expect(screen.getByLabelText('React')).toBeInTheDocument();
      expect(screen.getByLabelText('Vue.js')).toBeInTheDocument();
      expect(screen.getByLabelText('Angular')).toBeInTheDocument();
    });

    it('shows different subjects for backend domain', () => {
      render(<SubjectSelector domain="backend" />);
      expect(screen.getByLabelText('Node.js')).toBeInTheDocument();
      expect(screen.getByLabelText('Python')).toBeInTheDocument();
      expect(screen.getByLabelText('Java')).toBeInTheDocument();
    });

    it('shows database subjects', () => {
      render(<SubjectSelector domain="database" />);
      expect(screen.getByLabelText('SQL')).toBeInTheDocument();
      expect(screen.getByLabelText('NoSQL')).toBeInTheDocument();
      expect(screen.getByLabelText('MongoDB')).toBeInTheDocument();
    });

    it('shows devops subjects', () => {
      render(<SubjectSelector domain="devops" />);
      expect(screen.getByLabelText('Docker')).toBeInTheDocument();
      expect(screen.getByLabelText('Kubernetes')).toBeInTheDocument();
      expect(screen.getByLabelText('CI/CD')).toBeInTheDocument();
    });

    it('shows security subjects', () => {
      render(<SubjectSelector domain="security" />);
      expect(screen.getByLabelText('Authentication')).toBeInTheDocument();
      expect(screen.getByLabelText('Encryption')).toBeInTheDocument();
      expect(screen.getByLabelText('Vulnerabilities')).toBeInTheDocument();
    });

    it('hides message when domain is selected', () => {
      render(<SubjectSelector domain="frontend" />);
      expect(screen.queryByText(/Select a domain first/)).not.toBeInTheDocument();
    });
  });

  describe('Multi-Select', () => {
    it('allows selecting multiple subjects', async () => {
      const user = userEvent.setup();
      render(<SubjectSelector domain="frontend" />);

      const reactCheckbox = screen.getByLabelText('React');
      const vueCheckbox = screen.getByLabelText('Vue.js');

      await user.click(reactCheckbox);
      await user.click(vueCheckbox);

      expect(reactCheckbox).toBeChecked();
      expect(vueCheckbox).toBeChecked();
    });

    it('allows deselecting subjects', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SubjectSelector domain="frontend" value={['react']} />
      );

      const reactCheckbox = screen.getByLabelText('React');
      expect(reactCheckbox).toBeChecked();

      rerender(
        <SubjectSelector domain="frontend" value={['react']} onChange={() => {}} />
      );

      await user.click(reactCheckbox);
    });

    it('calls onChange with array of selected subjects', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <SubjectSelector
          domain="frontend"
          onChange={handleChange}
        />
      );

      const reactCheckbox = screen.getByLabelText('React');
      await user.click(reactCheckbox);

      expect(handleChange).toHaveBeenCalledWith(['react']);
    });

    it('calls onChange with multiple subjects', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <SubjectSelector
          domain="frontend"
          onChange={handleChange}
        />
      );

      const reactCheckbox = screen.getByLabelText('React');
      const vueCheckbox = screen.getByLabelText('Vue.js');

      await user.click(reactCheckbox);
      await user.click(vueCheckbox);

      expect(handleChange).toHaveBeenLastCalledWith(['react', 'vue']);
    });
  });

  describe('Selected Count Badge', () => {
    it('displays selection count badge when subjects are selected', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react', 'vue']}
        />
      );
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows singular label for one selection', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react']}
        />
      );
      const badge = screen.getByLabelText(/1 subject selected/);
      expect(badge).toBeInTheDocument();
    });

    it('shows plural label for multiple selections', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react', 'vue']}
        />
      );
      const badge = screen.getByLabelText(/2 subjects selected/);
      expect(badge).toBeInTheDocument();
    });

    it('hides badge when no subjects selected', () => {
      render(
        <SubjectSelector domain="frontend" />
      );
      expect(screen.queryByText(/subject.*selected/i)).not.toBeInTheDocument();
    });

    it('applies primary color to badge', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react']}
        />
      );
      const badge = screen.getByText('1');
      expect(badge).toHaveClass('bg-primary-600');
    });
  });

  describe('Required Field Validation', () => {
    it('shows validation error when required and no subjects selected', () => {
      render(
        <SubjectSelector
          domain="frontend"
          required
          variant="error"
        />
      );
      expect(screen.getByText(/Please select at least one subject/)).toBeInTheDocument();
    });

    it('shows custom error message when provided', () => {
      render(
        <SubjectSelector
          domain="frontend"
          errorMessage="Custom error"
          variant="error"
        />
      );
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });

    it('does not show validation error when subjects are selected', () => {
      render(
        <SubjectSelector
          domain="frontend"
          required
          value={['react']}
        />
      );
      expect(screen.queryByText(/Please select at least one subject/)).not.toBeInTheDocument();
    });

    it('shows asterisk for required field', () => {
      render(
        <SubjectSelector
          domain="frontend"
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('displays helper text when domain is selected', () => {
      render(
        <SubjectSelector
          domain="frontend"
          helperText="Select at least one technology"
        />
      );
      expect(screen.getByText('Select at least one technology')).toBeInTheDocument();
    });

    it('shows domain-specific message when no domain selected', () => {
      render(<SubjectSelector />);
      expect(screen.getByText(/Select a domain first/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through checkboxes', async () => {
      const user = userEvent.setup();
      render(<SubjectSelector domain="frontend" />);
      const reactCheckbox = screen.getByLabelText('React');

      await user.tab();
      expect(reactCheckbox).toHaveFocus();
    });

    it('supports space to toggle checkbox', async () => {
      const user = userEvent.setup();
      render(<SubjectSelector domain="frontend" />);
      const reactCheckbox = screen.getByLabelText('React');

      reactCheckbox.focus();
      await user.keyboard(' ');

      expect(reactCheckbox).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('has group role with proper aria-label', () => {
      render(<SubjectSelector domain="frontend" />);
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Subject selection');
    });

    it('checkboxes have proper aria-labels', () => {
      render(<SubjectSelector domain="frontend" />);
      expect(screen.getByLabelText('React')).toHaveAttribute('aria-label', 'React');
      expect(screen.getByLabelText('Vue.js')).toHaveAttribute('aria-label', 'Vue.js');
    });

    it('supports aria-invalid for error state', () => {
      const { container } = render(
        <SubjectSelector
          domain="frontend"
          variant="error"
          errorMessage="Error"
        />
      );
      const invalidElement = container.querySelector('[aria-invalid="true"]');
      expect(invalidElement).toBeInTheDocument();
    });

    it('badge has aria-label for screen readers', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react', 'vue', 'angular']}
        />
      );
      const badge = screen.getByLabelText(/3 subjects selected/);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom Subjects', () => {
    it('renders custom subjects when provided', () => {
      const customSubjects = {
        custom: [
          { id: 'c1', label: 'Custom 1' },
          { id: 'c2', label: 'Custom 2' },
        ],
      };
      render(
        <SubjectSelector
          domain="custom"
          subjects={customSubjects}
        />
      );
      expect(screen.getByLabelText('Custom 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom 2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies border styling to subject options', () => {
      const { container } = render(<SubjectSelector domain="frontend" />);
      const options = container.querySelectorAll('[role="presentation"]');
      expect(options.length).toBeGreaterThan(0);
      options.forEach((option) => {
        expect(option).toHaveClass('border-2');
        expect(option).toHaveClass('border-neutral-200');
      });
    });

    it('applies hover styling to subject options', () => {
      const { container } = render(<SubjectSelector domain="frontend" />);
      const options = container.querySelectorAll('[role="presentation"]');
      expect(options.length).toBeGreaterThan(0);
      options.forEach((option) => {
        expect(option).toHaveClass('hover:border-primary-300');
      });
    });

    it('applies custom className', () => {
      const { container } = render(
        <SubjectSelector className="custom-selector" />
      );
      const formField = container.firstChild;
      expect(formField).toHaveClass('custom-selector');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<SubjectSelector ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('allows access to checkboxes through forwarded ref', () => {
      const ref = { current: null };
      render(
        <SubjectSelector
          ref={ref}
          domain="frontend"
        />
      );
      const checkboxes = ref.current?.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes?.length).toBe(3);
    });
  });

  describe('Initial Values', () => {
    it('respects value prop for initial selection', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react', 'vue']}
        />
      );
      expect(screen.getByLabelText('React')).toBeChecked();
      expect(screen.getByLabelText('Vue.js')).toBeChecked();
      expect(screen.getByLabelText('Angular')).not.toBeChecked();
    });

    it('shows correct badge count with initial values', () => {
      render(
        <SubjectSelector
          domain="frontend"
          value={['react', 'vue']}
        />
      );
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Empty Domain Handling', () => {
    it('shows message when domain has no subjects', () => {
      render(
        <SubjectSelector domain="nonexistent" />
      );
      expect(screen.getByText(/No subjects available/)).toBeInTheDocument();
    });
  });
});

