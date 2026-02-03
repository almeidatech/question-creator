'use client';

import { forwardRef, useState, useCallback, useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { FormField } from './form-field';
import { Checkbox } from './checkbox';

/**
 * Subject Object Interface
 */
export interface Subject {
  /** Unique subject identifier */
  id: string;
  /** Display label for the subject */
  label: string;
}

/**
 * SubjectSelector Component Props
 */
export interface SubjectSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
  /** Currently selected subject IDs */
  value?: string[];
  /** Callback when selection changes */
  onChange?: (subjects: string[]) => void;
  /** Domain to filter subjects by */
  domain?: string;
  /** Custom subject mapping by domain (defaults to predefined subjects) */
  subjects?: Record<string, Subject[]>;
  /** CSS class name */
  className?: string;
}

/**
 * Default subjects organized by domain
 */
const DEFAULT_SUBJECTS: Record<string, Subject[]> = {
  frontend: [
    { id: 'react', label: 'React' },
    { id: 'vue', label: 'Vue.js' },
    { id: 'angular', label: 'Angular' },
  ],
  backend: [
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
  ],
  database: [
    { id: 'sql', label: 'SQL' },
    { id: 'nosql', label: 'NoSQL' },
    { id: 'mongodb', label: 'MongoDB' },
  ],
  devops: [
    { id: 'docker', label: 'Docker' },
    { id: 'kubernetes', label: 'Kubernetes' },
    { id: 'cicd', label: 'CI/CD' },
  ],
  security: [
    { id: 'authentication', label: 'Authentication' },
    { id: 'encryption', label: 'Encryption' },
    { id: 'vulnerabilities', label: 'Vulnerabilities' },
  ],
};

/**
 * SubjectSelector Molecule Component
 *
 * Extends FormField with subject-specific multi-selection logic.
 * Displays checkboxes for subjects filtered by the selected domain.
 * Shows selected count badge and validates at least one selection.
 * Accessible keyboard navigation with WCAG AA compliance.
 *
 * @example
 * ```tsx
 * <SubjectSelector
 *   label="Select Subjects"
 *   required
 *   domain="frontend"
 *   value={selectedSubjects}
 *   onChange={(subjects) => setSelectedSubjects(subjects)}
 * />
 * ```
 */
export const SubjectSelector = forwardRef<HTMLDivElement, SubjectSelectorProps>(
  ({
    label = 'Select Subjects',
    required = false,
    helperText,
    errorMessage,
    variant = 'default',
    value = [],
    onChange,
    domain,
    subjects = DEFAULT_SUBJECTS,
    className = '',
  }, ref) => {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(value);

    // Filter subjects by domain
    const filteredSubjects = useMemo(() => {
      if (!domain || !subjects[domain]) {
        return [];
      }
      return subjects[domain];
    }, [domain, subjects]);

    const handleChange = useCallback((subjectId: string, checked: boolean) => {
      let newSelection: string[];
      if (checked) {
        newSelection = [...selectedSubjects, subjectId];
      } else {
        newSelection = selectedSubjects.filter((id) => id !== subjectId);
      }
      setSelectedSubjects(newSelection);
      onChange?.(newSelection);
    }, [selectedSubjects, onChange]);

    // Validate at least one subject selected
    const isValid = selectedSubjects.length > 0;
    const hasError = required && !isValid && variant === 'error';

    const groupId = 'subject-selector-group';
    const badgeCount = selectedSubjects.length;

    return (
      <FormField
        ref={ref}
        label={
          label && (
            <div className="flex items-center justify-between">
              <span>{label}</span>
              {badgeCount > 0 && (
                <span
                  className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-primary-600 rounded-full"
                  aria-label={`${badgeCount} subject${badgeCount !== 1 ? 's' : ''} selected`}
                >
                  {badgeCount}
                </span>
              )}
            </div>
          )
        }
        required={required}
        helperText={
          !domain
            ? 'Select a domain first to see available subjects'
            : helperText
        }
        errorMessage={
          hasError
            ? 'Please select at least one subject'
            : errorMessage
        }
        variant={variant}
        htmlFor={groupId}
        className={className}
      >
        <div
          id={groupId}
          role="group"
          aria-label="Subject selection"
          className="space-y-3"
        >
          {!domain ? (
            <p className="text-sm text-neutral-500 italic">
              No domain selected. Please select a domain first.
            </p>
          ) : filteredSubjects.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">
              No subjects available for this domain.
            </p>
          ) : (
            filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="p-3 border-2 border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
              >
                <Checkbox
                  id={`subject-${subject.id}`}
                  label={subject.label}
                  value={subject.id}
                  checked={selectedSubjects.includes(subject.id)}
                  onChange={(e) => handleChange(subject.id, e.target.checked)}
                  aria-label={subject.label}
                />
              </div>
            ))
          )}
        </div>
      </FormField>
    );
  }
);

SubjectSelector.displayName = 'SubjectSelector';

