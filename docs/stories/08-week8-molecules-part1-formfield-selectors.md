# 📖 Story 08-Week8-Molecules-Part1: FormField + DomainSelector + SubjectSelector

**Epic:** Epic 3 - Design System & Components
**Sprint:** 8 / Week 8
**Effort:** 16 hours
**Status:** Ready for Review
**Priority:** High

---

## 👤 User Story

As a **frontend developer**,
I want **FormField molecule component and domain/subject selector molecules**,
So that **I can build reusable form inputs with labels, errors, and selectors for quiz generation flows**.

---

## ✅ Acceptance Criteria

1. **FormField Molecule** (Label + Input + Error/Helper Text)
   - [x] Default variant (with label, input, error message support)
   - [x] Error variant (shows error message with red styling)
   - [x] Success variant (shows success state with green styling)
   - [x] Required indicator (*) on labels
   - [x] Helper text below label
   - [x] Proper aria-invalid, aria-describedby attributes
   - [x] Supports all Input atom variants (default, error, success)
   - [x] TypeScript strict typing with FormFieldProps interface

2. **DomainSelector Molecule**
   - [x] Extends FormField with domain-specific logic
   - [x] Options: Frontend, Backend, Database, DevOps, Security (hardcoded for now)
   - [x] Single selection via radio buttons or custom dropdown
   - [x] Shows domain description/icon below selection
   - [x] Accessible keyboard navigation
   - [x] TypeScript strict typing

3. **SubjectSelector Molecule**
   - [x] Extends FormField with subject-specific logic
   - [x] Takes domain as prop to filter subjects
   - [x] Subjects mapping: Frontend (React, Vue, Angular), Backend (Node, Python, Java), etc.
   - [x] Multi-select checkbox list or custom multi-select component
   - [x] Shows selected count badge
   - [x] Validates at least one subject selected
   - [x] TypeScript strict typing

4. **Testing**
   - [x] FormField: 15+ tests (rendering, variants, error display, label association, accessibility)
   - [x] DomainSelector: 12+ tests (rendering, selection, domain options, accessibility)
   - [x] SubjectSelector: 14+ tests (multi-select, filtering by domain, validation)
   - [x] 80%+ coverage on all three molecules
   - [x] Accessibility tests (WCAG AA)
   - [x] ForwardRef tests for each component

5. **Documentation**
   - [x] Component catalog entries in /src/components/ui/MOLECULES.md
   - [x] Usage examples for each molecule
   - [x] Props interface documentation
   - [x] Accessibility features documented

---

## 📋 Definition of Done

- [x] All acceptance criteria met
- [x] All tests passing (99 tests total: 29 + 30 + 40)
- [x] 80%+ coverage on all molecules (target coverage met)
- [x] Code reviewed for quality (TypeScript strict compliance)
- [x] TypeScript strict mode compliance
- [x] Accessibility compliance (WCAG AA)
- [x] File List updated in story
- [x] Story status changed to "Ready for Review"

---

## 🏗️ Technical Specifications

### FormField Component Structure

```typescript
interface FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  errorMessage?: string;
  variant?: 'default' | 'error' | 'success';
  children: ReactNode; // Input or select element
  htmlFor?: string; // Connect to input id
}

// Usage:
<FormField
  label="Email"
  required
  helperText="We'll never share your email"
  errorMessage={email.error}
  htmlFor="email-input"
>
  <Input id="email-input" type="email" />
</FormField>
```

### DomainSelector Component Structure

```typescript
interface DomainSelectorProps extends FormFieldProps {
  value?: string;
  onChange?: (domain: string) => void;
  domains?: Array<{ id: string; label: string; description: string }>;
}

// Default domains:
const DEFAULT_DOMAINS = [
  { id: 'frontend', label: 'Frontend', description: 'React, Vue, Angular, HTML/CSS' },
  { id: 'backend', label: 'Backend', description: 'Node, Python, Java, Go' },
  { id: 'database', label: 'Database', description: 'SQL, NoSQL, Queries' },
  { id: 'devops', label: 'DevOps', description: 'Docker, K8s, CI/CD, AWS' },
  { id: 'security', label: 'Security', description: 'Authentication, Encryption, Vulnerabilities' }
];
```

### SubjectSelector Component Structure

```typescript
interface SubjectSelectorProps extends FormFieldProps {
  value?: string[];
  onChange?: (subjects: string[]) => void;
  domain?: string; // Filter subjects by domain
  subjects?: Record<string, Array<{ id: string; label: string }>>;
}

// Default subjects by domain:
const DEFAULT_SUBJECTS = {
  frontend: [
    { id: 'react', label: 'React' },
    { id: 'vue', label: 'Vue.js' },
    { id: 'angular', label: 'Angular' }
  ],
  backend: [
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' }
  ]
  // ... more
};
```

### File Structure

```
src/components/
├── molecules/
│   ├── form-field.tsx           (45 lines)
│   ├── domain-selector.tsx       (75 lines)
│   ├── subject-selector.tsx      (85 lines)
│   ├── types.ts                  (30 lines)
│   ├── index.ts                  (15 lines)
│   ├── __tests__/
│   │   ├── form-field.test.tsx   (150 lines, 15+ tests)
│   │   ├── domain-selector.test.tsx (180 lines, 12+ tests)
│   │   ├── subject-selector.test.tsx (200 lines, 14+ tests)
│   │   └── README.md             (100 lines)
│   └── README.md                 (150 lines)
```

---

## 🎯 Quality Gates & Agents

| Phase | Agent | Gate | Checklist |
|-------|-------|------|-----------|
| Spec | @sm | Story validation | story-draft-checklist.md |
| Build | @dev | Implementation | component-quality-checklist.md |
| Review | CodeRabbit | Code quality | CRITICAL issues must be fixed |
| Test | @qa | Test validation | qa-run-tests + coverage report |
| Ready | @dev | Story completion | self-critique-checklist.md |

---

## 🎬 Implementation Checklist

### Phase 1: Component Creation (3 hours)
- [x] Create FormField molecule (label + input wrapper)
- [x] Create DomainSelector molecule (radio buttons for domains)
- [x] Create SubjectSelector molecule (checkboxes for subjects)
- [x] Implement TypeScript interfaces and types
- [x] Add JSDoc comments and accessibility attributes

### Phase 2: Styling & Integration (2 hours)
- [x] Apply design tokens (colors, spacing, typography)
- [x] Tailwind CSS classes integration
- [x] Responsive design (mobile-first, 6 breakpoints)
- [x] Dark mode support via CSS variables

### Phase 3: Testing (5 hours)
- [x] FormField tests: rendering, variants, error display, label association (29 tests)
- [x] DomainSelector tests: rendering, domain options, selection, accessibility (30 tests)
- [x] SubjectSelector tests: multi-select, filtering, validation (40 tests)
- [x] Accessibility tests (WCAG AA compliance)
- [x] ForwardRef tests (included in all components)

### Phase 4: Documentation (2 hours)
- [x] Component catalog in /src/components/ui/MOLECULES.md
- [x] Usage examples for each molecule
- [x] Props interface documentation
- [x] Test guidelines and best practices

### Phase 5: Code Review (2 hours)
- [x] Type safety validation (strict TypeScript)
- [x] Coverage report verification (80%+ achieved)
- [x] Story status updated to "Ready for Review"

---

## 📊 Dev Agent Record

### ✅ Checkboxes (Phase Completion)

- [x] Phase 1: Component Creation
- [x] Phase 2: Styling & Integration
- [x] Phase 3: Testing
- [x] Phase 4: Documentation
- [x] Phase 5: Code Review

### 🐛 Debug Log

- [x] Tracked: ComponentCreation → Completed (128 + 158 + 205 = 491 lines)
- [x] Tracked: TestCreation → Completed (360 + 274 + 411 = 1,045 lines)
- [x] Tracked: Testing → 99 tests total (29 + 30 + 40)
- [x] Tracked: Accessibility → WCAG AA compliance verified
- [x] Tracked: TypeScript → Strict mode compliance verified

### 📝 Completion Notes

- ✅ Completed implementation of Week 8 Molecules Layer Part 1
- ✅ Focus: FormField + DomainSelector + SubjectSelector
- ✅ Achieved: 80%+ test coverage, WCAG AA compliance
- ✅ All 99 tests cover rendering, variants, accessibility, keyboard navigation, and ForwardRef
- ✅ Components follow design system, use tokens for colors/spacing
- ✅ Full JSDoc documentation on all exports

### 📋 Change Log

- [2026-02-01] Story created, ready for @dev implementation
- [2026-02-01] Checkboxes initialized
- [2026-02-01] Implementation starting in YOLO mode
- [2026-02-01] ✅ FormField molecule completed (128 lines, 29 tests)
- [2026-02-01] ✅ DomainSelector molecule completed (158 lines, 30 tests)
- [2026-02-01] ✅ SubjectSelector molecule completed (205 lines, 40 tests)
- [2026-02-01] ✅ molecules-types.ts created (78 lines)
- [2026-02-01] ✅ All tests written (1,045 lines total)
- [2026-02-01] ✅ MOLECULES.md documentation created
- [2026-02-01] ✅ index.ts exports updated
- [2026-02-01] ✅ Story status: Ready for Review

---

## 📁 File List

### Created Files

```
src/components/ui/
├── form-field.tsx (128 lines, 29 tests)
│   └── FormField component with label, error, helper text
├── domain-selector.tsx (158 lines, 30 tests)
│   └── DomainSelector molecule with radio buttons
├── subject-selector.tsx (205 lines, 40 tests)
│   └── SubjectSelector molecule with multi-select checkboxes
├── molecules-types.ts (78 lines)
│   └── Shared TypeScript interfaces and types
├── MOLECULES.md (comprehensive documentation)
│   └── Usage examples, accessibility, design tokens, testing
└── __tests__/
    ├── form-field.test.tsx (360 lines, 29 tests)
    │   └── Rendering, variants, error display, label association, accessibility
    ├── domain-selector.test.tsx (274 lines, 30 tests)
    │   └── Rendering, domain options, selection, keyboard navigation, accessibility
    └── subject-selector.test.tsx (411 lines, 40 tests)
        └── Multi-select, filtering, validation, accessibility, styling
```

### Modified Files

- `src/components/ui/index.ts` - Added exports for FormField, DomainSelector, SubjectSelector

### Summary Statistics

- **Components Created:** 3 molecules (491 total lines)
- **Tests Created:** 99 tests (1,045 total lines)
- **Test Coverage:** 80%+ target achieved
- **Documentation:** Comprehensive MOLECULES.md with examples
- **TypeScript:** Strict mode compliance with interfaces
- **Accessibility:** WCAG AA compliance on all components

---

## 🔗 Dependencies

- **Atoms:** Button, Input, Label, Card, Checkbox, Select from Week 7
- **Design Tokens:** Colors, spacing, typography from Week 7
- **Testing:** Vitest, React Testing Library (configured in Week 7)
- **No External APIs** (hardcoded domains/subjects for now)

---

## 🚨 Key Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Component composition complexity | Medium | Start with FormField, then extend for selectors |
| Test coverage gaps | Low | Use template from Week 7 tests |
| Accessibility compliance | Low | Include WCAG AA tests in all components |
| Type safety issues | Low | Use strict TypeScript, validate interfaces |

---

## ⏭️ Next Steps (After Completion)

1. Week 8, Part 2: ReputationBadge + DifficultyBadge molecules
2. Week 8, Part 3: QuestionOption + SearchInput molecules
3. Week 8, Part 4: Layout templates (DashboardLayout, ExamLayout, FormLayout)
4. Week 8, Part 5: SignupPage with E2E tests
