# 📖 Story 08-Week8-Molecules-Part3: QuestionOption + SearchInput

**Epic:** Epic 3 - Design System & Components
**Sprint:** 8 / Week 8
**Effort:** 12 hours
**Status:** Ready for Dev
**Priority:** High

---

## 👤 User Story

As a **frontend developer**,
I want **QuestionOption and SearchInput molecule components**,
So that **I can display question options in exams and provide search functionality for question filtering**.

---

## ✅ Acceptance Criteria

1. **QuestionOption Molecule**
   - [ ] Renders radio button with question option content
   - [ ] Supports selected/unselected states
   - [ ] Supports multiple choice (radio) and single choice (checkbox)
   - [ ] Shows option label, description, and optional icon
   - [ ] Disabled state support
   - [ ] Hover effects and visual feedback
   - [ ] Keyboard navigation (Tab, Enter, Space)
   - [ ] Accessibility: aria-checked, role="radio" or role="checkbox"
   - [ ] Proper focus management for keyboard users
   - [ ] TypeScript strict typing with QuestionOptionProps interface
   - [ ] 15+ unit tests

2. **SearchInput Molecule**
   - [ ] Text input with search icon
   - [ ] Real-time search with onChange callback
   - [ ] Clear button when input has content
   - [ ] Debounced search support (500ms)
   - [ ] Placeholder text for empty state
   - [ ] Optional search result count display
   - [ ] Keyboard shortcuts (Escape to clear, Enter to submit)
   - [ ] Accessibility: aria-label, aria-describedby for helper text
   - [ ] Autocomplete suggestions support (optional)
   - [ ] TypeScript strict typing with SearchInputProps interface
   - [ ] 15+ unit tests

3. **Shared Input Utilities**
   - [ ] Debounce utility function
   - [ ] Search state management helpers
   - [ ] Option filtering logic
   - [ ] TypeScript strict typing

4. **Testing**
   - [ ] QuestionOption: 15+ tests (rendering, states, keyboard, accessibility)
   - [ ] SearchInput: 15+ tests (rendering, search, debounce, keyboard, accessibility)
   - [ ] 80%+ coverage on both molecules
   - [ ] Accessibility tests (WCAG AA)
   - [ ] Keyboard navigation tests

5. **Documentation**
   - [ ] Component catalog entries in /src/components/ui/MOLECULES.md
   - [ ] Usage examples for both components
   - [ ] Props interface documentation
   - [ ] Keyboard shortcuts documented
   - [ ] Accessibility features documented

---

## 📋 Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (30+ tests total)
- [ ] 80%+ coverage on both molecules
- [ ] TypeScript strict mode compliance
- [ ] Accessibility compliance (WCAG AA)
- [ ] Keyboard navigation fully working
- [ ] File List updated in story
- [ ] Story status changed to "Ready for Review"

---

## 🏗️ Technical Specifications

### QuestionOption Component Structure

```typescript
interface QuestionOptionProps {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  isSelected?: boolean;
  isDisabled?: boolean;
  type?: 'radio' | 'checkbox';
  onChange?: (selected: boolean) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

// Usage:
<QuestionOption
  id="opt-1"
  label="Option A"
  description="This is option A"
  isSelected={selectedOption === 'opt-1'}
  type="radio"
  onChange={() => setSelectedOption('opt-1')}
/>
```

### SearchInput Component Structure

```typescript
interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number; // default: 500
  resultCount?: number;
  showResultCount?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

// Usage:
<SearchInput
  value={searchValue}
  placeholder="Search questions..."
  onChange={setSearchValue}
  onSearch={handleSearch}
  debounceMs={300}
  showResultCount
  resultCount={45}
/>
```

### File Structure

```
src/components/ui/
├── question-option.tsx       (85 lines)
├── search-input.tsx          (100 lines)
├── input-utils.ts            (50 lines)
├── __tests__/
│   ├── question-option.test.tsx (280 lines, 15+ tests)
│   ├── search-input.test.tsx (300 lines, 15+ tests)
│   └── input-utils.test.ts (150 lines, 10+ tests)
└── MOLECULES.md (updated)
```

---

## 🎯 Quality Gates & Agents

| Phase | Agent | Gate |
|-------|-------|------|
| Build | @dev | Implementation |
| Test | @qa | Test validation |
| Ready | @dev | Story completion |

---

## 🎬 Implementation Checklist

### Phase 1: Component Creation (3 hours)
- [ ] Create QuestionOption molecule
- [ ] Create SearchInput molecule
- [ ] Create input-utils.ts with shared logic
- [ ] Implement debounce utility
- [ ] Add JSDoc comments and accessibility

### Phase 2: Styling & Integration (2 hours)
- [ ] Apply design tokens (colors, spacing from Week 7)
- [ ] Tailwind CSS integration
- [ ] Hover and focus states
- [ ] Icon integration (search, clear icons)
- [ ] Responsive design

### Phase 3: Keyboard Navigation (1.5 hours)
- [ ] Implement keyboard handlers for QuestionOption
- [ ] Implement keyboard shortcuts for SearchInput
- [ ] Tab order management
- [ ] Focus trap handling

### Phase 4: Testing (3 hours)
- [ ] QuestionOption tests (15+)
- [ ] SearchInput tests (15+)
- [ ] Utility function tests (10+)
- [ ] Accessibility tests (WCAG AA)
- [ ] Coverage verification (80%+)

### Phase 5: Documentation (1.5 hours)
- [ ] Update MOLECULES.md with examples
- [ ] Props documentation
- [ ] Keyboard shortcuts documented
- [ ] Accessibility features documented

### Phase 6: Code Review (1 hour)
- [ ] Type safety validation
- [ ] Coverage report verification
- [ ] Story status update

---

## 📊 Dev Agent Record

### ✅ Checkboxes (Phase Completion)

- [ ] Phase 1: Component Creation
- [ ] Phase 2: Styling & Integration
- [ ] Phase 3: Keyboard Navigation
- [ ] Phase 4: Testing
- [ ] Phase 5: Documentation
- [ ] Phase 6: Code Review

### 🐛 Debug Log

- [ ] Tracked: SearchComponents → Starting

### 📝 Completion Notes

- Starting implementation of Week 8 Molecules Layer Part 3
- Focus: QuestionOption + SearchInput
- Target: 80%+ test coverage, WCAG AA compliance, full keyboard navigation

### 📋 Change Log

- [2026-02-01] Story created, ready for @dev implementation

---

## 📁 File List (To be updated)

```
src/components/ui/
├── question-option.tsx
├── search-input.tsx
├── input-utils.ts
└── __tests__/
    ├── question-option.test.tsx
    ├── search-input.test.tsx
    └── input-utils.test.ts
```

---

## 🔗 Dependencies

- **Atoms:** Input from Week 7
- **Design Tokens:** Colors, spacing from Week 7
- **Testing:** Vitest, React Testing Library
- **Utilities:** Debounce function, keyboard event handlers

---

## 🚨 Key Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Debounce complexity | Low | Use standard debounce pattern, test with multiple scenarios |
| Keyboard navigation | Medium | Use ref-based focus management, comprehensive keyboard tests |
| Accessibility | Low | Include WCAG AA tests in all components |
| Performance | Low | Use useCallback for handlers, memoize components |
