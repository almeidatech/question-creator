# 🧪 Test Examples & Patterns

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Setup & Configuração](#setup--configuração)
2. [Unit Tests](#unit-tests)
3. [Component Tests](#component-tests)
4. [Integration Tests](#integration-tests)
5. [API Route Tests](#api-route-tests)
6. [E2E Tests](#e2e-tests)
7. [Test Utilities](#test-utilities)

---

## Setup & Configuração

### Dependências

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^23.0.0",
    "happy-dom": "^12.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/mockData'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types')
    }
  }
});
```

### Test Setup

```typescript
// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  })
});
```

---

## Unit Tests

### 1. Utility Function Tests

```typescript
// lib/utils/__tests__/cn.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname merger)', () => {
  it('should merge class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conflicting Tailwind classes', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn(
      'base-class',
      isActive && 'active-class'
    )).toBe('base-class active-class');
  });

  it('should remove falsy values', () => {
    expect(cn(
      'class-1',
      false && 'class-2',
      undefined,
      null,
      'class-3'
    )).toBe('class-1 class-3');
  });

  it('should handle arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('should handle objects', () => {
    expect(cn({
      'px-2': true,
      'px-4': false
    })).toBe('px-2');
  });
});
```

### 2. Validation Schema Tests

```typescript
// lib/validations/__tests__/question.test.ts
import { describe, it, expect } from 'vitest';
import { QuestionGenerateSchema, FeedbackSchema } from '@/lib/validations/question';

describe('QuestionGenerateSchema', () => {
  it('should validate correct input', () => {
    const valid = {
      domain: 'constitucional',
      subject: 'direitos-fundamentais',
      difficulty: 'medium',
      count: 5,
      preferReal: true
    };
    expect(() => QuestionGenerateSchema.parse(valid)).not.toThrow();
  });

  it('should require domain and subject', () => {
    const invalid = {
      difficulty: 'medium'
    };
    expect(() => QuestionGenerateSchema.parse(invalid)).toThrow();
  });

  it('should validate count range', () => {
    const tooMany = {
      domain: 'constitucional',
      subject: 'test',
      difficulty: 'medium',
      count: 21
    };
    expect(() => QuestionGenerateSchema.parse(tooMany)).toThrow();
  });

  it('should have sensible defaults', () => {
    const minimal = {
      domain: 'constitucional',
      subject: 'test',
      difficulty: 'medium'
    };
    const result = QuestionGenerateSchema.parse(minimal);
    expect(result.count).toBe(5);
    expect(result.preferReal).toBe(true);
  });
});

describe('FeedbackSchema', () => {
  it('should validate feedback submission', () => {
    const valid = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      category: 'incorrect_answer',
      text: 'This answer should be B, not A, because...'
    };
    expect(() => FeedbackSchema.parse(valid)).not.toThrow();
  });

  it('should reject short feedback text', () => {
    const invalid = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      category: 'typo',
      text: 'Wrong'
    };
    expect(() => FeedbackSchema.parse(invalid)).toThrow();
  });

  it('should reject invalid categories', () => {
    const invalid = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      category: 'invalid_category',
      text: 'Some feedback text that is long enough'
    };
    expect(() => FeedbackSchema.parse(invalid)).toThrow();
  });

  it('should enforce max length', () => {
    const tooLong = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      category: 'other',
      text: 'a'.repeat(501)
    };
    expect(() => FeedbackSchema.parse(tooLong)).toThrow();
  });
});
```

### 3. Store Tests (Zustand)

```typescript
// lib/stores/__tests__/question-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useQuestionStore } from '@/lib/stores/use-question-store';

describe('Question Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    const store = useQuestionStore.getState();
    store.endSession();
    store.setFilters({});
  });

  it('should initialize with empty state', () => {
    const store = useQuestionStore.getState();
    expect(store.session).toBeNull();
    expect(store.filters).toEqual({});
    expect(store.isGenerating).toBe(false);
  });

  it('should set filters', () => {
    const store = useQuestionStore.getState();
    store.setFilters({ domain: 'constitucional', difficulty: 'medium' });

    expect(store.filters.domain).toBe('constitucional');
    expect(store.filters.difficulty).toBe('medium');
  });

  it('should merge filters when setting', () => {
    const store = useQuestionStore.getState();
    store.setFilters({ domain: 'constitucional' });
    store.setFilters({ difficulty: 'hard' });

    expect(store.filters.domain).toBe('constitucional');
    expect(store.filters.difficulty).toBe('hard');
  });

  it('should start a session with questions', () => {
    const questions = [
      { id: '1', questionText: 'Q1', difficulty: 'easy' },
      { id: '2', questionText: 'Q2', difficulty: 'medium' }
    ];
    const store = useQuestionStore.getState();

    store.startSession(questions);

    expect(store.session).not.toBeNull();
    expect(store.session!.questions).toEqual(questions);
    expect(store.session!.currentIndex).toBe(0);
  });

  it('should navigate between questions', () => {
    const questions = [
      { id: '1', questionText: 'Q1' },
      { id: '2', questionText: 'Q2' },
      { id: '3', questionText: 'Q3' }
    ];
    const store = useQuestionStore.getState();

    store.startSession(questions);
    expect(store.session!.currentIndex).toBe(0);

    store.nextQuestion();
    expect(store.session!.currentIndex).toBe(1);

    store.nextQuestion();
    expect(store.session!.currentIndex).toBe(2);

    // Shouldn't go past last
    store.nextQuestion();
    expect(store.session!.currentIndex).toBe(2);
  });

  it('should navigate backwards', () => {
    const questions = [
      { id: '1', questionText: 'Q1' },
      { id: '2', questionText: 'Q2' }
    ];
    const store = useQuestionStore.getState();

    store.startSession(questions);
    store.nextQuestion();
    expect(store.session!.currentIndex).toBe(1);

    store.previousQuestion();
    expect(store.session!.currentIndex).toBe(0);

    // Shouldn't go before first
    store.previousQuestion();
    expect(store.session!.currentIndex).toBe(0);
  });

  it('should end session', () => {
    const store = useQuestionStore.getState();
    store.startSession([{ id: '1', questionText: 'Q1' }]);
    expect(store.session).not.toBeNull();

    store.endSession();
    expect(store.session).toBeNull();
  });

  it('should track loading state', () => {
    const store = useQuestionStore.getState();
    expect(store.isGenerating).toBe(false);

    store.setIsGenerating(true);
    expect(store.isGenerating).toBe(true);

    store.setIsGenerating(false);
    expect(store.isGenerating).toBe(false);
  });
});
```

---

## Component Tests

### 1. Button Component Test

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Cancel</Button>);
    expect(button).toHaveClass('border');
  });

  it('should apply size styles', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('h-8');

    rerender(<Button size="lg">Large</Button>);
    expect(button).toHaveClass('h-10');
  });
});
```

### 2. ReputationBadge Component Test

```typescript
// components/questions/__tests__/reputation-badge.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReputationBadge } from '@/components/questions/reputation-badge';

describe('ReputationBadge', () => {
  it('should render score', () => {
    render(<ReputationBadge score={8} />);
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('should apply green color for high score (8+)', () => {
    const { container } = render(<ReputationBadge score={9} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should apply yellow color for medium score (5-7)', () => {
    const { container } = render(<ReputationBadge score={6} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should apply orange color for low score (2-4)', () => {
    const { container } = render(<ReputationBadge score={3} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
  });

  it('should apply red color for very low score (0-1)', () => {
    const { container } = render(<ReputationBadge score={0} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should apply size styles', () => {
    const { container: smContainer } = render(
      <ReputationBadge score={5} size="sm" />
    );
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: lgContainer } = render(
      <ReputationBadge score={5} size="lg" />
    );
    expect(lgContainer.firstChild).toHaveClass('text-base');
  });
});
```

### 3. QuestionCard Component Test

```typescript
// components/questions/__tests__/question-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuestionCard } from '@/components/questions/question-card';

const mockQuestion = {
  id: '1',
  questionText: 'What is the highest law in Brazil?',
  optionA: 'Civil Code',
  optionB: 'Federal Constitution',
  optionC: 'Penal Code',
  optionD: 'Labor Law',
  optionE: 'Administrative Law',
  correctAnswer: 'b' as const,
  examBoard: 'CESPE',
  examYear: 2022,
  sourceType: 'real_exam' as const,
  reputation: { currentScore: 9, status: 'active' as const }
};

describe('QuestionCard', () => {
  it('should render question text', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText(/What is the highest law/i)).toBeInTheDocument();
  });

  it('should render exam board and year', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText(/CESPE 2022/i)).toBeInTheDocument();
  });

  it('should render reputation badge', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(
      <QuestionCard question={mockQuestion} onClick={handleClick} />
    );

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should show preview options in full mode', () => {
    render(<QuestionCard question={mockQuestion} compact={false} />);
    expect(screen.getByText(/Civil Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Federal Constitution/i)).toBeInTheDocument();
  });

  it('should not show options in compact mode', () => {
    render(<QuestionCard question={mockQuestion} compact={true} />);
    expect(screen.queryByText(/Civil Code/i)).not.toBeInTheDocument();
  });
});
```

---

## Integration Tests

### 1. Question Generation Flow

```typescript
// __tests__/integration/question-generation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionGeneratorForm } from '@/components/questions/question-generator-form';

// Mock API
vi.mock('@/lib/api/questions', () => ({
  generateQuestions: vi.fn()
}));

describe('Question Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate questions from form submission', async () => {
    const { generateQuestions } = await import('@/lib/api/questions');
    const mockQuestions = [
      {
        id: '1',
        questionText: 'Test Question',
        difficulty: 'medium'
      }
    ];
    (generateQuestions as any).mockResolvedValue(mockQuestions);

    render(<QuestionGeneratorForm />);

    // Select domain
    await userEvent.selectOptions(
      screen.getByDisplayValue('Select domain'),
      'constitucional'
    );

    // Select subject
    await userEvent.selectOptions(
      screen.getByDisplayValue('Select subject'),
      'direitos-fundamentais'
    );

    // Select difficulty
    await userEvent.selectOptions(
      screen.getByDisplayValue('Select difficulty'),
      'medium'
    );

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(generateQuestions).toHaveBeenCalledWith({
        domain: 'constitucional',
        subject: 'direitos-fundamentais',
        difficulty: 'medium',
        count: 5,
        preferReal: true
      });
    });
  });

  it('should display loading state while generating', async () => {
    const { generateQuestions } = await import('@/lib/api/questions');
    (generateQuestions as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<QuestionGeneratorForm />);

    // Fill form and submit
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    expect(screen.getByText(/Generating/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Generating/i)).not.toBeInTheDocument();
    });
  });
});
```

### 2. Feedback Submission Flow

```typescript
// __tests__/integration/feedback-submission.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackDialog } from '@/components/questions/feedback-dialog';

vi.mock('@/lib/api/feedback', () => ({
  submitFeedback: vi.fn()
}));

describe('Feedback Submission Integration', () => {
  it('should submit feedback through dialog', async () => {
    const { submitFeedback } = await import('@/lib/api/feedback');
    (submitFeedback as any).mockResolvedValue({ id: 'feedback-1' });

    const questionId = 'question-123';
    render(<FeedbackDialog questionId={questionId} />);

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: /report/i }));

    // Select category
    await userEvent.selectOptions(
      screen.getByDisplayValue('Problem Type'),
      'incorrect_answer'
    );

    // Enter feedback text
    const textarea = screen.getByPlaceholderText(/Explain the problem/i);
    await userEvent.type(
      textarea,
      'The correct answer should be B, not A, because...'
    );

    // Submit
    await userEvent.click(
      screen.getByRole('button', { name: /submit/i })
    );

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        questionId,
        category: 'incorrect_answer',
        text: 'The correct answer should be B, not A, because...'
      });
    });
  });
});
```

---

## API Route Tests

### 1. Question Generation API

```typescript
// app/api/questions/__tests__/generate.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/questions/generate/route';

// Mock Supabase and Anthropic
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

vi.mock('@/lib/anthropic/client', () => ({
  generateQuestions: vi.fn()
}));

describe('POST /api/questions/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockReturnValue({
      auth: {
        getSession: () => ({ data: { session: null } })
      }
    });

    const request = new Request('http://localhost/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'constitucional',
        subject: 'test',
        difficulty: 'medium'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should validate required fields', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockReturnValue({
      auth: {
        getSession: () => ({
          data: { session: { user: { id: 'user-1' } } }
        })
      }
    });

    const request = new Request('http://localhost/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'constitucional'
        // missing subject and difficulty
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should generate and return questions', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateQuestions } = await import('@/lib/anthropic/client');

    const mockSession = { user: { id: 'user-1' } };
    const mockQuestions = [
      {
        id: 'q-1',
        questionText: 'Test',
        optionA: 'A',
        optionB: 'B',
        correctAnswer: 'a',
        difficulty: 'medium',
        sourceType: 'real_exam'
      }
    ];

    (createClient as any).mockReturnValue({
      auth: {
        getSession: () => ({ data: { session: mockSession } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockQuestions })
          })
        })
      })
    });

    (generateQuestions as any).mockResolvedValue([]);

    const request = new Request('http://localhost/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'constitucional',
        subject: 'direitos-fundamentais',
        difficulty: 'medium',
        count: 5,
        preferReal: true
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.questions).toBeDefined();
    expect(data.stats).toBeDefined();
  });
});
```

### 2. Submit Answer API

```typescript
// app/api/questions/__tests__/submit.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/questions/[id]/submit/route';

vi.mock('@/lib/supabase/server');

describe('POST /api/questions/{id}/submit', () => {
  it('should validate answer selection', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockReturnValue({
      auth: { getSession: () => ({ data: { session: { user: { id: 'u1' } } } }) }
    });

    const request = new Request('http://localhost/api/questions/q1/submit', {
      method: 'POST',
      body: JSON.stringify({
        selectedAnswer: 'x' // Invalid: should be a-e
      })
    });

    const response = await POST(request, { params: { id: 'q1' } });
    expect(response.status).toBe(400);
  });

  it('should record answer in history', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockInsert = vi.fn().mockResolvedValue({});

    (createClient as any).mockReturnValue({
      auth: {
        getSession: () => ({ data: { session: { user: { id: 'u1' } } } })
      },
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'q1',
              correct_answer: 'a',
              commentary: 'Explanation'
            }],
            error: null
          })
        })
        .mockReturnValueOnce({
          insert: mockInsert
        })
    });

    const request = new Request('http://localhost/api/questions/q1/submit', {
      method: 'POST',
      body: JSON.stringify({
        selectedAnswer: 'a',
        responseTimeMs: 5000,
        context: 'practice'
      })
    });

    const response = await POST(request, { params: { id: 'q1' } });
    expect(response.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });
});
```

---

## E2E Tests

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E Test Example

```typescript
// e2e/question-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Question Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('/dashboard');
  });

  test('should generate questions end-to-end', async ({ page }) => {
    // Navigate to generator
    await page.goto('/dashboard/questions/generate');

    // Select options
    await page.selectOption('select[name="domain"]', 'constitucional');
    await page.selectOption('select[name="subject"]', 'direitos-fundamentais');
    await page.selectOption('select[name="difficulty"]', 'medium');

    // Submit form
    await page.click('button:has-text("Generate")');

    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-card"]');
    const cards = await page.locator('[data-testid="question-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should answer question and see feedback', async ({ page }) => {
    await page.goto('/dashboard/questions');

    // Click first question
    await page.click('[data-testid="question-card"]:first-child');

    // Wait for detail page
    await page.waitForSelector('[data-testid="question-detail"]');

    // Select an answer
    await page.click('input[value="a"]');

    // Submit answer
    await page.click('button:has-text("Submit Answer")');

    // Check for feedback
    await page.waitForSelector('[data-testid="feedback-result"]');
    const feedback = await page.locator('[data-testid="feedback-result"]');

    expect(feedback).toBeVisible();
  });

  test('should submit feedback', async ({ page }) => {
    await page.goto('/dashboard/questions');
    await page.click('[data-testid="question-card"]:first-child');

    // Click report button
    await page.click('button:has-text("Report")');

    // Fill feedback form
    await page.selectOption('select[name="category"]', 'typo');
    await page.fill('textarea', 'There is a typo in option B');

    // Submit
    await page.click('button:has-text("Submit Report")');

    // Verify success
    await page.waitForSelector('text=Thank you for your feedback');
    await expect(page.locator('text=Thank you for your feedback')).toBeVisible();
  });
});
```

---

## Test Utilities

### Custom Render Function

```typescript
// test/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

function TestWrapper({ children }: { children: React.ReactNode }) {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

export * from '@testing-library/react';
```

### Usage

```typescript
import { renderWithProviders, screen } from '@/test/test-utils';

it('should work with providers', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('content')).toBeInTheDocument();
});
```

---

### Mock Data Factory

```typescript
// test/fixtures/question.factory.ts
import { Question } from '@/types/questions';

export function createQuestion(overrides?: Partial<Question>): Question {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    questionText: 'What is the Federal Constitution of Brazil?',
    optionA: 'A law establishing rules',
    optionB: 'The highest law of the country',
    optionC: 'A decree from the president',
    optionD: 'An internal regulation',
    optionE: 'A court decision',
    correctAnswer: 'b',
    difficulty: 'easy',
    sourceType: 'real_exam',
    examBoard: 'CESPE',
    examYear: 2022,
    reputation: {
      currentScore: 8,
      status: 'active',
      totalAttempts: 100,
      correctAttempts: 85
    },
    ...overrides
  };
}

export function createQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) =>
    createQuestion({
      id: `q-${i + 1}`,
      questionText: `Question ${i + 1}`
    })
  );
}
```

### Factory Usage

```typescript
import { createQuestion, createQuestions } from '@/test/fixtures/question.factory';

it('should render question', () => {
  const question = createQuestion({ difficulty: 'hard' });
  render(<QuestionDetail question={question} />);
  expect(screen.getByText(/Question/)).toBeInTheDocument();
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test lib/__tests__/utils.test.ts

# Run tests matching pattern
npm run test -t "Button"

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:ui
```

### GitHub Actions CI

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Run E2E tests
        run: npm run test:e2e
```

---

**Próximo:** Leia [PERFORMANCE_BENCHMARKS.md](./PERFORMANCE_BENCHMARKS.md) para métricas e otimizações.
