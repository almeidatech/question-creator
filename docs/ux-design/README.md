# 🎨 UX/UI Design System - Question Creator MVP

**Version:** 1.0 | **Date:** 2026-02-01 | **Status:** ✅ Design Phase Complete

---

## 📑 Documentation Index

This folder contains the complete UX/UI design system for the Question Creator MVP, including design tokens, atomic component library, and user flows.

### Core Documents

1. **[DESIGN_TOKENS.md](./DESIGN_TOKENS.md)** - Visual foundation (colors, typography, spacing, shadows)
2. **[ATOMIC_DESIGN.md](./ATOMIC_DESIGN.md)** - Component structure and organization (atoms → molecules → organisms)
3. **[COMPONENT_MAP.md](./COMPONENT_MAP.md)** - Complete component inventory and usage matrix

### User Flows (5 Critical Paths)

- **[01-SIGNUP_FLOW.md](./USER_FLOWS/01-SIGNUP_FLOW.md)** - Authentication & profile setup (Week 1-2)
- **[02-GENERATE_QUESTIONS_FLOW.md](./USER_FLOWS/02-GENERATE_QUESTIONS_FLOW.md)** - Question generation with RAG (Week 3-5)
- **[03-ANSWER_QUESTION_FLOW.md](./USER_FLOWS/03-ANSWER_QUESTION_FLOW.md)** - Answer & submit workflow (Week 4-5)
- **[04-EXAM_SIMULATION_FLOW.md](./USER_FLOWS/04-EXAM_SIMULATION_FLOW.md)** - Exam attempt & navigation (Week 6-7)
- **[05-RESULTS_FLOW.md](./USER_FLOWS/05-RESULTS_FLOW.md)** - Score & analytics (Week 7)

---

## 🎯 Quick Navigation

### For Developers
→ Start with [ATOMIC_DESIGN.md](./ATOMIC_DESIGN.md) then [COMPONENT_MAP.md](./COMPONENT_MAP.md)

### For Product/Designers
→ Start with [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) then user flows

### For Architects
→ Reference [ATOMIC_DESIGN.md](./ATOMIC_DESIGN.md) for component boundaries

---

## 📊 Design System Structure

```
┌─────────────────────────────────────────────────┐
│  TEMPLATES & PAGES                              │
│  (Full page layouts: Dashboard, Exam, etc)      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  ORGANISMS (Complex Sections)                   │
│  QuestionCard, ExamAttempt, ReviewQueue, etc    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  MOLECULES (Simple Combinations)                │
│  FormField, ReputationBadge, QuestionOption    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  ATOMS (Base Components)                        │
│  Button, Input, Select, Checkbox, Card, etc    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  DESIGN TOKENS (Visual Foundation)              │
│  Colors, Typography, Spacing, Shadows           │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Design System at a Glance

### Color Palette

| Color | Primary Use | Hex |
|-------|------------|-----|
| **Primary Blue** | Main actions, focus states | #3b82f6 |
| **Legal Blue** | Constitutional Law theme | #2563eb |
| **Success Green** | Correct answers, success states | #22c55e |
| **Error Red** | Wrong answers, errors | #ef4444 |
| **Warning Amber** | Warnings, loading states | #f59e0b |
| **Neutral Gray** | Text, borders, backgrounds | #6b7280 |

### Typography Scale

- **Headings**: 30px (H1) → 20px (H3) → 18px (section titles)
- **Body Text**: 16px (primary) → 14px (secondary)
- **Labels & Captions**: 12px-14px
- **Font Stack**: Inter (body), Fira Code (mono)

### Spacing System

- **Base Unit**: 4px (0.25rem)
- **Common Values**: 4, 8, 12, 16, 24, 32, 48, 64px
- **Used for**: Padding, margins, gaps, heights

### Components Count

| Layer | Count | Examples |
|-------|-------|----------|
| **Atoms** | 14 | Button, Input, Select, Card, Badge, etc |
| **Molecules** | 6 | FormField, QuestionOption, ReputationBadge |
| **Organisms** | 8 | QuestionCard, ExamAttempt, DashboardHeader |

---

## 🔗 Related Documentation

- **[EPICS.md](../EPICS.md)** - Epic breakdown for implementation
- **[02-question-generation-rag.md](../stories/02-question-generation-rag.md)** - Development stories with component assignments
- **[BANCO_DE_DADOS_DIAGRAMA.md](../BANCO_DE_DADOS_DIAGRAMA.md)** - Database schema (for state management)
- **[COMPONENTES_SHOWCASE.md](../COMPONENTES_SHOWCASE.md)** - Component examples and patterns

---

## 📋 Implementation Checklist

- [ ] Implement Design Tokens (Tailwind config)
- [ ] Build Atoms layer (Button, Input, Select, etc)
- [ ] Build Molecules layer (FormField, ReputationBadge, etc)
- [ ] Build Organisms layer (QuestionCard, ExamAttempt, etc)
- [ ] Create page templates
- [ ] Integrate with Supabase (for state management)
- [ ] Test accessibility (WCAG AA)
- [ ] Documentation & Storybook

---

## 🚀 Implementation Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| **7-8** | Foundation | Tokens + Atoms + Molecules |
| **8-9** | Components | Organisms + Templates |
| **9-10** | Integration | Pages + Real data + Testing |

---

**Last Updated:** 2026-02-01
**Design Lead:** Uma (UX Design Expert) 🎨
**Status:** ✅ Ready for Development

Next: Share with @dev for implementation sprint

