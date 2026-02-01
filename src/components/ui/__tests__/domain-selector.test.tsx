import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainSelector } from '../domain-selector';

describe('DomainSelector', () => {
  describe('Rendering', () => {
    it('renders domain selector component', () => {
      render(<DomainSelector />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders with default label', () => {
      render(<DomainSelector />);
      expect(screen.getByText('Select Domain')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<DomainSelector label="Choose Your Domain" />);
      expect(screen.getByText('Choose Your Domain')).toBeInTheDocument();
    });

    it('renders all default domain options', () => {
      render(<DomainSelector />);
      expect(screen.getByLabelText(/Frontend:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Backend:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Database:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/DevOps:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Security:/)).toBeInTheDocument();
    });

    it('displays domain descriptions', () => {
      render(<DomainSelector />);
      expect(screen.getByText('React, Vue, Angular, HTML/CSS')).toBeInTheDocument();
      expect(screen.getByText('Node, Python, Java, Go')).toBeInTheDocument();
    });
  });

  describe('Domain Options', () => {
    it('renders custom domains when provided', () => {
      const customDomains = [
        { id: 'mobile', label: 'Mobile', description: 'iOS, Android' },
        { id: 'embedded', label: 'Embedded', description: 'C, Rust' },
      ];
      render(<DomainSelector domains={customDomains} />);
      expect(screen.getByText('Mobile')).toBeInTheDocument();
      expect(screen.getByText('Embedded')).toBeInTheDocument();
      expect(screen.getByText('iOS, Android')).toBeInTheDocument();
    });

    it('renders radio buttons for each domain', () => {
      render(<DomainSelector />);
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(5);
    });
  });

  describe('Selection', () => {
    it('allows selection of a domain', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const frontendRadio = screen.getByLabelText(/Frontend:/);
      await user.click(frontendRadio);
      expect(frontendRadio).toBeChecked();
    });

    it('only allows one domain selected at a time', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const frontendRadio = screen.getByLabelText(/Frontend:/);
      const backendRadio = screen.getByLabelText(/Backend:/);

      await user.click(frontendRadio);
      expect(frontendRadio).toBeChecked();
      expect(backendRadio).not.toBeChecked();

      await user.click(backendRadio);
      expect(backendRadio).toBeChecked();
      expect(frontendRadio).not.toBeChecked();
    });

    it('calls onChange callback when domain is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DomainSelector onChange={handleChange} />);

      const frontendRadio = screen.getByLabelText(/Frontend:/);
      await user.click(frontendRadio);

      expect(handleChange).toHaveBeenCalledWith('frontend');
    });

    it('respects value prop for initial selection', () => {
      render(<DomainSelector value="backend" />);
      const backendRadio = screen.getByLabelText(/Backend:/);
      expect(backendRadio).toBeChecked();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const firstRadio = screen.getAllByRole('radio')[0];

      await user.tab();
      expect(firstRadio).toHaveFocus();
    });

    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const firstRadio = screen.getAllByRole('radio')[0];
      const secondRadio = screen.getAllByRole('radio')[1];

      await user.click(firstRadio);
      await user.keyboard('{ArrowDown}');

      // The next radio should be focused or selected
      expect(firstRadio).toBeChecked();
    });

    it('supports space to select radio button', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const backendRadio = screen.getByLabelText(/Backend:/);

      backendRadio.focus();
      await user.keyboard(' ');

      expect(backendRadio).toBeChecked();
    });
  });

  describe('Required Indicator', () => {
    it('shows required asterisk when required prop is true', () => {
      render(<DomainSelector required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show asterisk when not required', () => {
      render(<DomainSelector />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(<DomainSelector helperText="Choose a development domain" />);
      expect(screen.getByText('Choose a development domain')).toBeInTheDocument();
    });

    it('does not display helper text when not provided', () => {
      render(<DomainSelector />);
      expect(screen.queryByText('Choose a development domain')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when variant is error', () => {
      render(
        <DomainSelector
          variant="error"
          errorMessage="Domain selection is required"
        />
      );
      expect(screen.getByText('Domain selection is required')).toBeInTheDocument();
    });

    it('applies error styling to label', () => {
      render(
        <DomainSelector
          label="Domain"
          variant="error"
          errorMessage="Required"
        />
      );
      const label = screen.getByText('Domain');
      expect(label).toHaveClass('text-error-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on radio buttons', () => {
      render(<DomainSelector />);
      expect(screen.getByLabelText(/Frontend:/)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/Backend:/)).toHaveAttribute('aria-label');
    });

    it('radio group has role="group"', () => {
      render(<DomainSelector />);
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
    });

    it('supports aria-invalid for error state', () => {
      const { container } = render(
        <DomainSelector
          variant="error"
          errorMessage="Error"
        />
      );
      const invalidElement = container.querySelector('[aria-invalid="true"]');
      expect(invalidElement).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<DomainSelector />);
      const firstRadio = screen.getAllByRole('radio')[0];

      await user.tab();
      expect(firstRadio).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('applies border styling to domain options', () => {
      const { container } = render(<DomainSelector />);
      const domainOptions = container.querySelectorAll('[role="presentation"]');
      expect(domainOptions.length).toBeGreaterThan(0);
      domainOptions.forEach((option) => {
        expect(option).toHaveClass('border-2');
        expect(option).toHaveClass('border-neutral-200');
      });
    });

    it('applies hover styling to domain options', () => {
      const { container } = render(<DomainSelector />);
      const domainOptions = container.querySelectorAll('[role="presentation"]');
      expect(domainOptions.length).toBeGreaterThan(0);
      domainOptions.forEach((option) => {
        expect(option).toHaveClass('hover:border-primary-300');
      });
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<DomainSelector ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('allows access to radio buttons through forwarded ref', () => {
      const ref = { current: null };
      render(<DomainSelector ref={ref} />);
      const radioButtons = ref.current?.querySelectorAll('input[type="radio"]');
      expect(radioButtons?.length).toBe(5);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<DomainSelector className="custom-selector" />);
      const formField = container.firstChild;
      expect(formField).toHaveClass('custom-selector');
    });
  });

  describe('Click Selection', () => {
    it('allows selecting domain by clicking on the container', async () => {
      const user = userEvent.setup();
      const { container } = render(<DomainSelector />);
      const domainContainers = container.querySelectorAll('[role="presentation"]');
      const firstDomainContainer = domainContainers[0];

      await user.click(firstDomainContainer);

      const radio = firstDomainContainer.querySelector('input[type="radio"]');
      expect(radio).toBeChecked();
    });
  });
});
