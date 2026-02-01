# US-1.4: Dashboard & Navigation UI

**Epic:** Epic 1 - Core Features
**Sprint:** 1.2 / Week 2
**Effort:** 24h
**Assigned to:** @dev, @ux-expert
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student
**I want** to see my dashboard with study stats and navigate to features
**So that** I can understand my progress and access study tools easily

---

## Acceptance Criteria

- [ ] **Layout Components** render correctly
  - Header with logo, user menu, logout
  - Sidebar with navigation links (Dashboard, Questions, Exams, Settings)
  - Footer with links + copyright
  - Responsive: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
  - Dark mode support (optional, store in localStorage)

- [ ] **Auth Pages** (Login, Signup, Recovery) work
  - Login form: email input, password input, \"Remember me\" checkbox, submit button
  - Shows error messages (invalid credentials, network error)
  - Signup form: email, password, confirm password, \"I agree to ToS\" checkbox
  - Password recovery: email input, verification code, new password
  - Form validation shows errors in real-time (Zod)
  - Submit button disabled until form valid

- [ ] **Dashboard Page** displays user stats
  - Welcome message: \"Hello, [First Name]\"
  - Stats cards: total_questions_attempted, correct_count, accuracy_percentage, streak_days
  - Activity chart: questions answered per day (last 7 days)
  - Weak areas list: topics with < 50% accuracy
  - Quick action buttons: \"Generate Questions\", \"Create Exam\", \"Review History\"
  - All stats update in real-time (< 1s latency)

- [ ] **Question Card** displays question + options
  - Shows question text
  - 4 clickable option buttons (A, B, C, D)
  - Submit button (disabled until option selected)
  - After submit: shows if correct/incorrect
  - Shows explanation of correct answer
  - \"Next Question\" button appears after feedback

- [ ] **Accessibility** meets WCAG 2.1 AA
  - [ ] All text has sufficient contrast ratio (> 4.5:1)
  - [ ] All interactive elements keyboard accessible (tab order)
  - [ ] Form labels associated with inputs
  - [ ] Images have alt text
  - [ ] Color not sole indicator of status (also use icons/text)

---

## Definition of Done

- [ ] All components render without errors
- [ ] Forms handle validation + display errors clearly
- [ ] Mobile responsive (tested on iPhone 12, iPad, desktop)
- [ ] Accessibility: WCAG 2.1 AA passed (axe DevTools scan)
- [ ] LightHouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] React Testing Library coverage ≥ 80%
- [ ] Documentation: Component props, usage examples
- [ ] Bundle size < 300KB gzipped
- [ ] No console errors/warnings in production build
- [ ] E2E test: signup → dashboard → see stats → click \"Generate\"

---

## Technical Specifications

### Component Structure

```typescript
// Layout Components
<Layout>
  <Header user={user} onLogout={logout} />
  <Sidebar currentRoute={currentRoute} />
  <main>{children}</main>
  <Footer />
</Layout>

// Auth Pages
<LoginForm onSubmit={handleLogin} />
<SignupForm onSubmit={handleSignup} />
<PasswordRecoveryForm onSubmit={handleRecovery} />

// Dashboard
<StatsCard label="Questions Answered" value={342} trend="+12" />
<ActivityChart data={weeklyData} />
<WeakAreasList areas={weakAreas} />
<QuickActionButtons actions={['Generate', 'CreateExam', 'Review']} />

// Question Card
<QuestionCard
  question={question}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

### Form Validation (Zod)

```typescript
const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required")
});

const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Min 8 chars")
    .regex(/[A-Z]/, "Need uppercase"),
  confirm_password: z.string(),
  agreed_to_tos: z.boolean().refine(val => val === true, "Must agree to ToS")
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});
```

### Responsive Breakpoints (Tailwind)

```typescript
// Mobile first
className="flex flex-col gap-4 sm:flex-row sm:gap-6 md:gap-8"
// Mobile: 1 column
// sm (640px): 2 columns
// md (768px): wider gap
```

### Accessibility Checklist

```typescript
// Example: Form input with proper labeling
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={errors.email ? "true" : "false"}
    aria-describedby={errors.email ? "email-error" : undefined}
    className="mt-1 block w-full rounded-md border"
  />
  {errors.email && (
    <p id="email-error" className="mt-2 text-sm text-red-600">
      {errors.email.message}
    </p>
  )}
</div>
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] React Testing Library: button clicks, form submissions, validation
- [ ] Accessibility scan (axe DevTools): no critical issues
- [ ] Mobile responsive test (3 viewports: 320px, 768px, 1920px)
- [ ] Bundle size check (< 300KB gzipped)

### Pre-PR

- [ ] LightHouse CI: score ≥ 90
- [ ] @ux-expert accessibility review
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge)

### Pre-Deployment

- [ ] E2E test: signup → dashboard → generate → see question
- [ ] Performance test: First Contentful Paint < 2s

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Slow page load (bundle bloat) | Code splitting, lazy loading, bundle analysis |
| Accessibility issues | @ux-expert review, WCAG 2.1 AA testing tools |
| Responsive design breaks on specific devices | Test on real devices + emulators |

---

## Dependencies

- [ ] Design system / Tailwind configured
- [ ] Zustand stores created (auth, ui state)
- [ ] Story 1.1 (Auth endpoints) completed
- [ ] Story 1.2 (Questions endpoint) completed

---

## Implementation Checklist

- [ ] Create Layout wrapper component
- [ ] Create Header component with user menu
- [ ] Create Sidebar navigation
- [ ] Create Footer component
- [ ] Create Login form component
- [ ] Create Signup form component
- [ ] Create Password recovery form
- [ ] Create Dashboard page
- [ ] Create Stats cards
- [ ] Create Activity chart (use Recharts)
- [ ] Create Weak areas list
- [ ] Create Question card component
- [ ] Setup dark mode support
- [ ] Test accessibility with axe DevTools
- [ ] Optimize bundle size
- [ ] Write E2E tests

---

**Created:** 2026-02-01
**Previous Story:** [03-question-submission-reputation.md](./03-question-submission-reputation.md)
**Next Story:** [05-exam-crud-infrastructure.md](./05-exam-crud-infrastructure.md)
