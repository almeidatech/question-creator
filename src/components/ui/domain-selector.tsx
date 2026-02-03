'use client';

import { forwardRef, useState, useCallback } from 'react';
import type { HTMLAttributes } from 'react';
import { FormField } from './form-field';
import { Radio, RadioGroup } from './radio-group';

/**
 * Domain Object Interface
 */
export interface Domain {
  /** Unique domain identifier */
  id: string;
  /** Display label for the domain */
  label: string;
  /** Description of the domain */
  description: string;
}

/**
 * DomainSelector Component Props
 */
export interface DomainSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Label for the form field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Visual state variant */
  variant?: 'default' | 'error' | 'success';
  /** Currently selected domain ID */
  value?: string;
  /** Callback when selection changes */
  onChange?: (domain: string) => void;
  /** Custom domain options (defaults to predefined domains) */
  domains?: Domain[];
  /** CSS class name */
  className?: string;
}

/**
 * Default domains with descriptions
 */
const DEFAULT_DOMAINS: Domain[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    description: 'React, Vue, Angular, HTML/CSS',
  },
  {
    id: 'backend',
    label: 'Backend',
    description: 'Node, Python, Java, Go',
  },
  {
    id: 'database',
    label: 'Database',
    description: 'SQL, NoSQL, Queries',
  },
  {
    id: 'devops',
    label: 'DevOps',
    description: 'Docker, K8s, CI/CD, AWS',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Authentication, Encryption, Vulnerabilities',
  },
];

/**
 * DomainSelector Molecule Component
 *
 * Extends FormField with domain-specific selection logic.
 * Displays radio buttons for single domain selection with descriptions.
 * Accessible keyboard navigation with WCAG AA compliance.
 *
 * @example
 * ```tsx
 * <DomainSelector
 *   label="Select Development Domain"
 *   required
 *   value={selectedDomain}
 *   onChange={(domain) => setSelectedDomain(domain)}
 * />
 * ```
 */
export const DomainSelector = forwardRef<HTMLDivElement, DomainSelectorProps>(
  ({
    label = 'Select Domain',
    required = false,
    helperText,
    errorMessage,
    variant = 'default',
    value,
    onChange,
    domains = DEFAULT_DOMAINS,
    className = '',
  }, ref) => {
    const [selectedDomain, setSelectedDomain] = useState<string | undefined>(value);

    const handleChange = useCallback((domainId: string) => {
      setSelectedDomain(domainId);
      onChange?.(domainId);
    }, [onChange]);

    const groupId = 'domain-selector-group';

    return (
      <FormField
        ref={ref}
        label={label}
        required={required}
        helperText={helperText}
        errorMessage={errorMessage}
        variant={variant}
        htmlFor={groupId}
        className={className}
      >
        <RadioGroup className="space-y-3">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="p-3 border-2 border-neutral-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => handleChange(domain.id)}
              role="presentation"
            >
              <div className="flex items-center">
                <Radio
                  id={`domain-${domain.id}`}
                  name={groupId}
                  value={domain.id}
                  label={domain.label}
                  checked={selectedDomain === domain.id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange(domain.id);
                    }
                  }}
                  aria-label={`${domain.label}: ${domain.description}`}
                />
              </div>
              <p className="mt-2 ml-7 text-sm text-neutral-600">
                {domain.description}
              </p>
            </div>
          ))}
        </RadioGroup>
      </FormField>
    );
  }
);

DomainSelector.displayName = 'DomainSelector';

