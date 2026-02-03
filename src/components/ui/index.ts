/**
 * UI Component Library Exports
 * All atomic components in one place
 */

// Atoms - Form elements
export { Button, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export { Select, type SelectProps } from './select';
export { Checkbox, type CheckboxProps } from './checkbox';
export { Radio, RadioGroup, type RadioProps, type RadioGroupProps } from './radio-group';
export { Label, type LabelProps } from './label';

// Atoms - Container & Display
export { Card, type CardProps } from './card';
export { Dialog, type DialogProps } from './dialog';
export { Badge, type BadgeProps } from './badge';
export { Divider, type DividerProps } from './divider';

// Atoms - Complex Components
export { Tabs, type TabsProps } from './tabs';
export { Spinner, type SpinnerProps } from './spinner';
export { Form, type FormProps } from './form';

// Atoms - Typography
export {
  Text,
  Heading1,
  Heading2,
  Heading3,
  Paragraph,
  Caption,
  type TextProps,
} from './text';

// Molecules - Form Components
export { FormField, type FormFieldProps } from './form-field';
export { DomainSelector, type DomainSelectorProps, type Domain } from './domain-selector';
export { SubjectSelector, type SubjectSelectorProps, type Subject } from './subject-selector';

// Molecules - Badge Components
export { ReputationBadge, type ReputationBadgeProps } from './reputation-badge';
export { DifficultyBadge, type DifficultyBadgeProps } from './difficulty-badge';

// Shared Types
export type {
  SizeVariant,
  ColorVariant,
  InputVariant,
  DisplayVariant,
  OrientationVariant,
} from './types';

// Molecules - Types
export type {
  FormVariant,
  IDomain,
  ISubject,
  IFormFieldState,
  IDomainSelection,
  ISubjectSelection,
  IFormSubmissionState,
  DomainChangeCallback,
  SubjectChangeCallback,
  FormSubmitCallback,
} from './molecules-types';

// Badge Utilities & Types
export type {
  ReputationLevel,
  DifficultyLevel,
  ReputationLevelConfig,
  DifficultyLevelConfig,
} from './badge-utils';
export {
  REPUTATION_LEVELS,
  DIFFICULTY_LEVELS,
  getBadgeSizeClasses,
  getReputationAriaLabel,
  getDifficultyAriaLabel,
  getBaseBadgeClasses,
} from './badge-utils';

