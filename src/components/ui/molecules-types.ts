/**
 * Molecule Component Types
 * Shared TypeScript interfaces for FormField, DomainSelector, and SubjectSelector
 */

/**
 * Form field variant types
 */
export type FormVariant = 'default' | 'error' | 'success';

/**
 * Domain object with id, label, and description
 */
export interface IDomain {
  id: string;
  label: string;
  description: string;
}

/**
 * Subject object with id and label
 */
export interface ISubject {
  id: string;
  label: string;
}

/**
 * Generic form field state
 */
export interface IFormFieldState {
  value?: string | string[];
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

/**
 * Domain selection state
 */
export interface IDomainSelection extends IFormFieldState {
  value?: string;
  selectedDomain?: string;
}

/**
 * Subject selection state
 */
export interface ISubjectSelection extends IFormFieldState {
  value?: string[];
  selectedSubjects?: string[];
  domain?: string;
}

/**
 * Form submission state
 */
export interface IFormSubmissionState {
  domain?: string;
  subjects?: string[];
  isValid?: boolean;
  errors?: Record<string, string>;
}

/**
 * Callback function for domain change
 */
export type DomainChangeCallback = (domain: string) => void;

/**
 * Callback function for subject change
 */
export type SubjectChangeCallback = (subjects: string[]) => void;

/**
 * Callback function for form submission
 */
export type FormSubmitCallback = (state: IFormSubmissionState) => void;

