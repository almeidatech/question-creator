# Molecule Components Documentation

This document covers the molecule-level components that combine atoms into more complex, reusable form components.

## Overview

Molecules are built from multiple atoms and represent larger, functional UI patterns. The molecules in this library focus on form components that handle label + input + validation combinations.

## Components

### 1. FormField

**Purpose:** A wrapper component that combines Label + Input/Select + Error/Helper Text into a reusable form field pattern.

**Location:** `./form-field.tsx`

**Props:**
```typescript
interface FormFieldProps {
  label?: string;                    // Label text for the field
  required?: boolean;                // Shows required indicator (*)
  helperText?: string;               // Helper text below field
  errorMessage?: string;             // Error message in error variant
  variant?: 'default' | 'error' | 'success';  // Visual state
  children: ReactNode;               // Input/Select element(s)
  htmlFor?: string;                  // Connect label to input
  className?: string;                // Custom CSS classes
}
```

**Features:**
- Label association with `htmlFor` attribute
- Required field indicator (*)
- Error message display with `role="alert"`
- Helper text support
- ARIA attributes for accessibility
- Three visual variants (default, error, success)
- ForwardRef support for DOM access

**Examples:**
```tsx
// Basic usage
<FormField
  label="Email"
  required
  htmlFor="email-input"
>
  <Input id="email-input" type="email" />
</FormField>

// With error state
<FormField
  label="Password"
  errorMessage="Password must be 8+ characters"
  variant="error"
  htmlFor="password-input"
>
  <Input id="password-input" type="password" />
</FormField>

// With helper text
<FormField
  label="Bio"
  helperText="Maximum 500 characters"
  htmlFor="bio-input"
>
  <Input id="bio-input" type="text" />
</FormField>
```

**Accessibility:**
- Semantic HTML labels
- `aria-invalid` for error state
- `aria-describedby` for error/helper text
- Screen reader support for required indicator
- Color contrast WCAG AA compliant

**Test Coverage:** 15+ tests covering rendering, variants, error display, label association, accessibility, and ForwardRef

---

### 2. DomainSelector

**Purpose:** A form field that allows single selection of a development domain with descriptions and radio buttons.

**Location:** `./domain-selector.tsx`

**Props:**
```typescript
interface DomainSelectorProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;                    // Form field label
  required?: boolean;                // Show required indicator
  helperText?: string;               // Helper text
  errorMessage?: string;             // Error message
  variant?: 'default' | 'error' | 'success';  // Visual state
  value?: string;                    // Selected domain ID
  onChange?: (domain: string) => void;  // Selection callback
  domains?: Domain[];                // Custom domains (optional)
  className?: string;                // Custom CSS classes
}

interface Domain {
  id: string;                        // Unique identifier
  label: string;                     // Display label
  description: string;               // Domain description
}
```

**Default Domains:**
- Frontend: React, Vue, Angular, HTML/CSS
- Backend: Node, Python, Java, Go
- Database: SQL, NoSQL, Queries
- DevOps: Docker, K8s, CI/CD, AWS
- Security: Authentication, Encryption, Vulnerabilities

**Features:**
- Single radio button selection
- Domain descriptions displayed below labels
- Clickable domain containers
- Keyboard navigation (Tab, Arrow keys, Space)
- Default domains provided
- Custom domain support
- Extends FormField for consistent styling

**Examples:**
```tsx
// Basic usage
<DomainSelector
  label="Select Development Domain"
  required
  onChange={(domain) => setSelectedDomain(domain)}
/>

// With custom domains
<DomainSelector
  label="Choose Domain"
  domains={[
    { id: 'ml', label: 'Machine Learning', description: 'TensorFlow, PyTorch' },
    { id: 'mobile', label: 'Mobile', description: 'iOS, Android' }
  ]}
  onChange={(domain) => setSelectedDomain(domain)}
/>

// With controlled value
<DomainSelector
  label="Domain"
  value={selectedDomain}
  onChange={(domain) => setSelectedDomain(domain)}
/>
```

**Accessibility:**
- Full keyboard support (Tab, Arrow keys, Space)
- ARIA labels on radio buttons
- Proper `role="group"` on radio group
- Error state with `aria-invalid`
- Visual focus indicators
- Color-independent state indication

**Test Coverage:** 12+ tests covering rendering, domain options, selection, keyboard navigation, accessibility, and styling

---

### 3. SubjectSelector

**Purpose:** A form field that allows multi-selection of subjects filtered by domain, with validation and selection count badge.

**Location:** `./subject-selector.tsx`

**Props:**
```typescript
interface SubjectSelectorProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;                    // Form field label
  required?: boolean;                // Show required indicator
  helperText?: string;               // Helper text
  errorMessage?: string;             // Error message
  variant?: 'default' | 'error' | 'success';  // Visual state
  value?: string[];                  // Selected subject IDs
  onChange?: (subjects: string[]) => void;  // Selection callback
  domain?: string;                   // Domain to filter subjects by
  subjects?: Record<string, Subject[]>;  // Custom subjects (optional)
  className?: string;                // Custom CSS classes
}

interface Subject {
  id: string;                        // Unique identifier
  label: string;                     // Display label
}
```

**Default Subjects by Domain:**
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: SQL, NoSQL, MongoDB
- DevOps: Docker, Kubernetes, CI/CD
- Security: Authentication, Encryption, Vulnerabilities

**Features:**
- Multi-select checkboxes
- Filtered by domain prop
- Selection count badge
- Validation for required subjects
- Extends FormField for consistent styling
- Responsive design
- Proper checkbox grouping

**Examples:**
```tsx
// Basic usage
<SubjectSelector
  label="Select Technologies"
  domain="frontend"
  value={selectedSubjects}
  onChange={(subjects) => setSelectedSubjects(subjects)}
/>

// With required validation
<SubjectSelector
  label="Technologies"
  domain="backend"
  required
  value={selectedSubjects}
  onChange={(subjects) => setSelectedSubjects(subjects)}
/>

// With custom subjects
<SubjectSelector
  domain="custom"
  subjects={{
    custom: [
      { id: 'c1', label: 'Custom 1' },
      { id: 'c2', label: 'Custom 2' }
    ]
  }}
  onChange={(subjects) => setSelectedSubjects(subjects)}
/>
```

**Accessibility:**
- Proper `role="group"` with `aria-label`
- Individual checkbox labels
- Badge with screen reader text (e.g., "3 subjects selected")
- Keyboard navigation (Tab, Space)
- Focus management
- Error state with `aria-invalid`
- Color contrast WCAG AA compliant

**Validation:**
- Shows message when no domain selected
- Validates at least one subject required (when `required` prop set)
- Selection count badge updates in real-time
- Custom error messages supported

**Test Coverage:** 14+ tests covering multi-select, filtering, validation, accessibility, styling, and ForwardRef

---

## Design Tokens Integration

All molecules use design tokens from the tokens directory:

**Colors:**
- Primary: `primary-500` to `primary-900` for main interactions
- Error: `error-500` to `error-600` for validation
- Success: `success-500` to `success-600` for positive states
- Neutral: `neutral-200` to `neutral-900` for text and borders

**Spacing:**
- Label margin-bottom: `spacing[2]` (8px)
- Field padding: `spacing[3]` (12px)
- Gap between options: `spacing[3]` (12px)
- Badge padding: `spacing[1]` to `spacing[2]`

**Typography:**
- Label size: `text-sm` (0.875rem)
- Helper text size: `text-sm` (0.875rem)
- Font weight (labels): `font-medium` (500)

---

## Styling

All molecules:
- Use Tailwind CSS for styling
- Support custom `className` prop
- Include dark mode support via CSS variables
- Use semantic color names (error, success, primary)
- Maintain visual consistency across states
- Include hover and focus states
- Responsive mobile-first design

---

## Accessibility (WCAG AA)

All molecules comply with WCAG AA standards:

✅ **Semantic HTML:** Proper use of `<label>`, `<input>`, roles
✅ **Keyboard Navigation:** Full support for Tab, Arrow keys, Space
✅ **Screen Readers:** ARIA labels, descriptions, error announcements
✅ **Color Contrast:** All text meets 4.5:1 minimum ratio
✅ **Focus Management:** Visible focus indicators, proper tab order
✅ **Error Handling:** Error messages announced as alerts
✅ **State Indication:** Not color-dependent alone

---

## ForwardRef Support

All molecules support ForwardRef to access the underlying DOM element:

```tsx
const formFieldRef = useRef<HTMLDivElement>(null);
const domainRef = useRef<HTMLDivElement>(null);
const subjectRef = useRef<HTMLDivElement>(null);

<FormField ref={formFieldRef}>
  <Input />
</FormField>

// Access underlying elements
formFieldRef.current?.querySelector('input');
```

---

## Testing

### Test Structure
- Unit tests with Vitest + React Testing Library
- 41+ total tests across all three molecules
- 80%+ code coverage target
- Accessibility testing (keyboard, ARIA)
- ForwardRef verification

### Running Tests
```bash
npm run test -- --coverage
```

### Test Categories
1. **Rendering:** Component mounts and displays correctly
2. **Props & Variants:** All variants and props work as expected
3. **User Interactions:** Click, keyboard, change events
4. **Accessibility:** ARIA attributes, keyboard navigation, screen readers
5. **Styling:** CSS classes applied correctly
6. **ForwardRef:** Ref forwarding works properly

---

## Best Practices

### Usage
1. Always provide `label` for accessibility
2. Use `htmlFor` on FormField to connect to input
3. Provide meaningful `helperText` for user guidance
4. Use `required` prop for mandatory fields
5. Handle `onChange` for controlled components

### Performance
1. Use `useCallback` for onChange handlers
2. Avoid unnecessary re-renders with proper dependency arrays
3. Memoize domain/subject lists if fetched from API

### Accessibility
1. Never remove labels (hide with CSS instead)
2. Always provide error messages in `errorMessage` prop
3. Use proper color contrast (tested against WCAG AA)
4. Test with keyboard-only navigation
5. Test with screen readers (NVDA, JAWS, VoiceOver)

---

## Migration from Previous Versions

If upgrading from older component versions:

1. **Labels:** Move from Input/Select to FormField
2. **Error handling:** Use `variant="error"` + `errorMessage`
3. **Helper text:** Use FormField's `helperText` prop
4. **Styling:** Use Tailwind classes in `className` prop

---

## Component Hierarchy

```
FormField (base wrapper)
├── Label (provided by FormField)
├── RadioGroup / Checkbox wrapper (provided by molecule)
└── Error/Helper text (provided by FormField)

DomainSelector extends FormField
├── FormField wrapper
└── RadioGroup with Domain options
    └── Radio buttons (custom styled)

SubjectSelector extends FormField
├── FormField wrapper
└── Checkbox group with Subject options
    └── Checkboxes (with selection badge)
```

---

### 4. ReputationBadge

**Purpose:** A badge component that displays user reputation levels with optional score indicators and visual representations.

**Location:** `./reputation-badge.tsx`

**Props:**
```typescript
interface ReputationBadgeProps extends HTMLAttributes<HTMLDivElement> {
  level: ReputationLevel;                    // Reputation level (beginner, intermediate, advanced, expert)
  score?: number;                            // Reputation score (0-100)
  size?: 'sm' | 'md' | 'lg';                 // Badge size
  showScore?: boolean;                       // Display score percentage
  showIcon?: boolean;                        // Display star indicators
}

type ReputationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
```

**Features:**
- Four reputation levels with distinct colors
- Optional score display (0-100%)
- Size variants (sm, md, lg)
- Star indicators for visual differentiation
- ARIA labels for screen reader support
- role="status" for accessibility
- ForwardRef support
- Design token color integration

**Level Mapping:**
- Beginner (Blue): 0+ score, 1 star
- Intermediate (Green): 30+ score, 2 stars
- Advanced (Orange): 60+ score, 3 stars
- Expert (Red): 90+ score, 4 stars

**Examples:**
```tsx
// Basic usage
<ReputationBadge level="intermediate" />

// With score display
<ReputationBadge
  level="advanced"
  score={75}
  showScore
  size="lg"
/>

// With icon and score
<ReputationBadge
  level="expert"
  score={95}
  showIcon
  showScore
/>
```

**Accessibility:**
- ARIA labels describing level and score
- role="status" for dynamic content
- Star icons hidden with aria-hidden
- Color contrast WCAG AA compliant
- Semantic HTML structure

**Test Coverage:** 30+ tests covering rendering, levels, colors, scores, icons, accessibility, ForwardRef, and props integration

---

### 5. DifficultyBadge

**Purpose:** A badge component that displays question/task difficulty levels with optional star indicators.

**Location:** `./difficulty-badge.tsx`

**Props:**
```typescript
interface DifficultyBadgeProps extends HTMLAttributes<HTMLDivElement> {
  difficulty: DifficultyLevel;               // Difficulty level (easy, medium, hard, expert)
  size?: 'sm' | 'md' | 'lg';                 // Badge size
  showIcon?: boolean;                        // Display star indicators (default: true)
  showLabel?: boolean;                       // Display difficulty label (default: true)
}

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
```

**Features:**
- Four difficulty levels with distinct colors
- Star indicator system (1-4 stars)
- Optional label display
- Size variants (sm, md, lg)
- ARIA labels for screen reader support
- role="status" for accessibility
- ForwardRef support
- Design token color integration

**Level Mapping:**
- Easy (Green): 1 star
- Medium (Orange): 2 stars
- Hard (Red): 3 stars
- Expert (Blue): 4 stars

**Examples:**
```tsx
// Basic usage with label and icons
<DifficultyBadge difficulty="medium" />

// With custom styling
<DifficultyBadge
  difficulty="hard"
  size="lg"
  showIcon
  showLabel
/>

// Icon only (no label)
<DifficultyBadge
  difficulty="expert"
  showIcon
  showLabel={false}
/>

// Icon and label with custom class
<DifficultyBadge
  difficulty="easy"
  className="custom-class"
/>
```

**Accessibility:**
- ARIA labels with star count representation
- role="status" for dynamic content
- Star icons hidden with aria-hidden
- Color contrast WCAG AA compliant
- Semantic HTML structure

**Test Coverage:** 36+ tests covering rendering, levels, colors, sizes, icons, labels, accessibility, ForwardRef, and props integration

---

## Shared Badge Utilities

**Location:** `./badge-utils.ts`

**Exports:**
```typescript
// Types
type ReputationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Constants
const REPUTATION_LEVELS: Record<ReputationLevel, ReputationLevelConfig>;
const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyLevelConfig>;

// Utility Functions
function getBadgeSizeClasses(size: 'sm' | 'md' | 'lg'): string;
function getReputationAriaLabel(level: ReputationLevel, score?: number): string;
function getDifficultyAriaLabel(difficulty: DifficultyLevel): string;
function getBaseBadgeClasses(): string;
```

**Features:**
- Centralized color and level mappings
- Reusable styling utility functions
- Accessibility label generation
- TypeScript strict typing
- Design token integration

---

## Future Enhancements

Potential improvements for future versions:
- [ ] Async subject/domain loading from API
- [ ] Search functionality for large option lists
- [ ] Virtual scrolling for performance
- [ ] Multi-step form integration
- [ ] Client-side validation rules
- [ ] Form state management integration (React Hook Form, Formik)

---

## Files

- `form-field.tsx` - FormField molecule component (75 lines)
- `domain-selector.tsx` - DomainSelector molecule component (75 lines)
- `subject-selector.tsx` - SubjectSelector molecule component (85 lines)
- `reputation-badge.tsx` - ReputationBadge molecule component (75 lines)
- `difficulty-badge.tsx` - DifficultyBadge molecule component (75 lines)
- `badge-utils.ts` - Shared badge utilities and constants (40 lines)
- `molecules-types.ts` - TypeScript interfaces (30 lines)
- `__tests__/form-field.test.tsx` - FormField tests (15+ tests)
- `__tests__/domain-selector.test.tsx` - DomainSelector tests (12+ tests)
- `__tests__/subject-selector.test.tsx` - SubjectSelector tests (14+ tests)
- `__tests__/reputation-badge.test.tsx` - ReputationBadge tests (30+ tests)
- `__tests__/difficulty-badge.test.tsx` - DifficultyBadge tests (36+ tests)

---

## Support

For issues or questions:
1. Check the examples in this documentation
2. Review the component JSDoc comments
3. Check test files for usage patterns
4. Refer to design tokens in `src/tokens/`
