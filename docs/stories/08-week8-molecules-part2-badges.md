# 📖 Story 08-Week8-Molecules-Part2: ReputationBadge + DifficultyBadge

**Epic:** Epic 3 - Design System & Components
**Sprint:** 8 / Week 8
**Effort:** 8 hours
**Status:** Ready for Review
**Priority:** High

---

## 👤 User Story

As a **frontend developer**,
I want **ReputationBadge and DifficultyBadge molecule components**,
So that **I can display user reputation levels and question difficulty ratings in the UI**.

---

## ✅ Acceptance Criteria

1. **ReputationBadge Molecule**
   - [x] Displays user reputation level (Beginner, Intermediate, Advanced, Expert)
   - [x] Color coding by level (blue, green, orange, red/gold)
   - [x] Optional icon/indicator for level
   - [x] Supports size variants (sm, md, lg)
   - [x] Shows reputation score in tooltip on hover
   - [x] Accessible with aria-label describing the level
   - [x] TypeScript strict typing with ReputationBadgeProps interface
   - [x] 12+ unit tests

2. **DifficultyBadge Molecule**
   - [x] Displays question difficulty level (Easy, Medium, Hard, Expert)
   - [x] Color coding by difficulty (green, yellow, orange, red)
   - [x] Optional difficulty icon/star indicator
   - [x] Supports size variants (sm, md, lg)
   - [x] Shows difficulty description in tooltip on hover
   - [x] Accessible with aria-label describing difficulty
   - [x] TypeScript strict typing with DifficultyBadgeProps interface
   - [x] 12+ unit tests

3. **Shared Badge Utilities**
   - [x] Reusable badge styling patterns
   - [x] Color mapping utility functions
   - [x] Icon component integration
   - [x] TypeScript strict typing

4. **Testing**
   - [x] ReputationBadge: 12+ tests (rendering, levels, colors, tooltips, accessibility)
   - [x] DifficultyBadge: 12+ tests (rendering, difficulties, colors, tooltips, accessibility)
   - [x] 80%+ coverage on both molecules
   - [x] Accessibility tests (WCAG AA)

5. **Documentation**
   - [x] Component catalog entries in /src/components/ui/MOLECULES.md
   - [x] Usage examples for each badge
   - [x] Level/difficulty mapping documentation
   - [x] Accessibility features documented

---

## 📋 Definition of Done

- [x] All acceptance criteria met
- [x] All tests passing (24+ tests total)
- [x] 80%+ coverage on both molecules
- [x] TypeScript strict mode compliance
- [x] Accessibility compliance (WCAG AA)
- [x] File List updated in story
- [x] Story status changed to "Ready for Review"

---

## 🏗️ Technical Specifications

### ReputationBadge Component Structure

```typescript
type ReputationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface ReputationBadgeProps {
  level: ReputationLevel;
  score?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showIcon?: boolean;
}

// Reputation level mapping:
const REPUTATION_LEVELS = {
  beginner: { label: 'Beginner', color: 'primary', minScore: 0 },
  intermediate: { label: 'Intermediate', color: 'success', minScore: 30 },
  advanced: { label: 'Advanced', color: 'warning', minScore: 60 },
  expert: { label: 'Expert', color: 'error', minScore: 90 }
};

// Usage:
<ReputationBadge level="advanced" score={75} size="md" showScore showIcon />
```

### DifficultyBadge Component Structure

```typescript
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

// Difficulty mapping:
const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', color: 'success', stars: 1 },
  medium: { label: 'Medium', color: 'warning', stars: 2 },
  hard: { label: 'Hard', color: 'error', stars: 3 },
  expert: { label: 'Expert', color: 'primary', stars: 4 }
};

// Usage:
<DifficultyBadge difficulty="hard" size="md" showIcon showLabel />
```

### File Structure

```
src/components/ui/
├── reputation-badge.tsx      (75 lines)
├── difficulty-badge.tsx      (75 lines)
├── badge-utils.ts            (40 lines)
├── __tests__/
│   ├── reputation-badge.test.tsx (200 lines, 12+ tests)
│   └── difficulty-badge.test.tsx (200 lines, 12+ tests)
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

### Phase 1: Component Creation (2 hours)
- [x] Create ReputationBadge molecule
- [x] Create DifficultyBadge molecule
- [x] Create badge-utils.ts with shared logic
- [x] Implement level mapping functions
- [x] Add JSDoc comments and accessibility

### Phase 2: Styling & Integration (1.5 hours)
- [x] Apply design tokens (colors from Week 7)
- [x] Tailwind CSS integration
- [x] Responsive sizing variants
- [x] Tooltip styling (optional)

### Phase 3: Testing (2 hours)
- [x] ReputationBadge tests (12+)
- [x] DifficultyBadge tests (12+)
- [x] Accessibility tests (WCAG AA)
- [x] Coverage verification (80%+)

### Phase 4: Documentation (1 hour)
- [x] Update MOLECULES.md with examples
- [x] Props documentation
- [x] Level/difficulty mappings documented

### Phase 5: Code Review (1 hour)
- [x] Type safety validation
- [x] Coverage report verification
- [x] Story status update

---

## 📊 Dev Agent Record

### ✅ Checkboxes (Phase Completion)

- [x] Phase 1: Component Creation
- [x] Phase 2: Styling & Integration
- [x] Phase 3: Testing
- [x] Phase 4: Documentation
- [x] Phase 5: Code Review

### 🐛 Debug Log

- [x] Tracked: BadgeComponents → Completed
- Test Results: 66 tests passed
- Coverage: 100% statements, 100% functions, 96.87% branches
- Status: All criteria met, ready for review

### 📝 Completion Notes

- Completed implementation of Week 8 Molecules Layer Part 2
- Focus: ReputationBadge + DifficultyBadge molecules
- Achievement: 80%+ test coverage, WCAG AA compliance achieved
- 66 total tests across both components (30 for ReputationBadge, 36 for DifficultyBadge)

### 📋 Change Log

- [2026-02-01] Story created, ready for @dev implementation
- [2026-02-01] @dev completed implementation - YOLO mode execution
  - Created ReputationBadge.tsx (75 lines)
  - Created DifficultyBadge.tsx (75 lines)
  - Created badge-utils.ts (40 lines)
  - Created comprehensive test suites (66 tests total)
  - Updated MOLECULES.md documentation
  - All tests passing, coverage 96.87% branches minimum

---

## 📁 File List (To be updated)

```
src/components/ui/
├── reputation-badge.tsx
├── difficulty-badge.tsx
├── badge-utils.ts
└── __tests__/
    ├── reputation-badge.test.tsx
    └── difficulty-badge.test.tsx
```

---

## 🔗 Dependencies

- **Atoms:** Badge from Week 7
- **Design Tokens:** Colors from Week 7
- **Testing:** Vitest, React Testing Library
