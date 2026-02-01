# 🔍 Component Library Showcase

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Componentes shadcn/ui](#componentes-shadcnui)
3. [Componentes Customizados](#componentes-customizados)
4. [Padrões de Uso](#padrões-de-uso)
5. [Composição de Componentes](#composição-de-componentes)

---

## Visão Geral

O projeto usa 2 camadas de componentes:

1. **shadcn/ui** - Componentes reutilizáveis sem marca (Headless UI + Radix)
2. **Custom Components** - Específicos do domínio de questões e educação

```text
┌─────────────────────────────────────────────┐
│       Application Components                │
│  (domain-specific, estado local)            │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      Custom Components                      │
│  (reusable patterns, estado elevado)        │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       shadcn/ui Components                  │
│  (primitives, sem styling opinionado)       │
└─────────────────────────────────────────────┘
```

---

## Componentes shadcn/ui

### 1. Button

**Arquivo:** `components/ui/button.tsx`

```typescript
import { Button } from '@/components/ui/button';

// Variant padrão
<Button>Click me</Button>

// Variantes
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <ChevronRight />
</Button>

// Estados
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

**Quando usar:**

- Ações primárias (submit, confirmar)
- Ações secundárias (cancelar)
- Estados especiais (delete = destructive)

---

### 2. Card

**Arquivo:** `components/ui/card.tsx`

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Questão #1</CardTitle>
    <CardDescription>Direitos Fundamentais</CardDescription>
  </CardHeader>
  <CardContent>
    <p>A Constituição Federal dispõe que...</p>
  </CardContent>
  <CardFooter>
    <Button>Responder</Button>
  </CardFooter>
</Card>
```

**Quando usar:**

- Agrupar conteúdo relacionado
- Questões individuais
- Stats widgets
- Feedback cards

---

### 3. Dialog (Modal)

**Arquivo:** `components/ui/dialog.tsx`

```typescript
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Report Problem</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Report this question</DialogTitle>
      <DialogDescription>
        Help us improve question quality
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button type="submit">Submit Report</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Quando usar:**

- Confirmações críticas
- Formulários secundários
- Feedback dialogs

---

### 4. Form

**Arquivo:** `components/ui/form.tsx`

```typescript
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';

const form = useForm<GenerateQuestionInput>({
  resolver: zodResolver(QuestionGenerateSchema),
  defaultValues: {
    domain: 'constitucional',
    difficulty: 'medium'
  }
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="domain"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Domain</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Generate</Button>
  </form>
</Form>
```

**Quando usar:**

- Todos os formulários
- Integra com React Hook Form e Zod
- Validação automática

---

### 5. Input

**Arquivo:** `components/ui/input.tsx`

```typescript
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter domain..."
  onChange={(e) => setDomain(e.target.value)}
/>

<Input
  type="number"
  min={1}
  max={20}
  placeholder="Number of questions"
/>

<Input
  type="email"
  placeholder="your@email.com"
/>
```

**Variantes:**

- text, email, number, password, search, url
- Com icons (via wrapper)
- Com validação visual

---

### 6. Select

**Arquivo:** `components/ui/select.tsx`

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

<Select value={difficulty} onValueChange={setDifficulty}>
  <SelectTrigger>
    <SelectValue placeholder="Select difficulty" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="easy">Easy</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="hard">Hard</SelectItem>
  </SelectContent>
</Select>
```

**Quando usar:**

- Seleção de um item entre muitos
- Dropdowns filtráveis
- Optimi para mobile

---

### 7. Checkbox

**Arquivo:** `components/ui/checkbox.tsx`

```typescript
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
  id="prefer-real"
  checked={preferReal}
  onCheckedChange={setPreferReal}
/>
<label htmlFor="prefer-real">
  Prefer real exam questions
</label>
```

**Padrão com Label:**

```typescript
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <label
    htmlFor="terms"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    I agree to terms
  </label>
</div>
```

---

### 8. RadioGroup

**Arquivo:** `components/ui/radio-group.tsx`

```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

<RadioGroup value={context} onValueChange={setContext}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="practice" id="practice" />
    <label htmlFor="practice">Practice</label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="exam_simulation" id="exam" />
    <label htmlFor="exam">Exam Simulation</label>
  </div>
</RadioGroup>
```

---

### 9. Table

**Arquivo:** `components/ui/table.tsx`

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

<Table>
  <TableCaption>A list of your recent questions.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Question</TableHead>
      <TableHead>Difficulty</TableHead>
      <TableHead>Attempts</TableHead>
      <TableHead className="text-right">Score</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {questions.map((q) => (
      <TableRow key={q.id}>
        <TableCell>{q.questionText}</TableCell>
        <TableCell>{q.difficulty}</TableCell>
        <TableCell>{q.attempts}</TableCell>
        <TableCell className="text-right">{q.score}%</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 10. Tabs

**Arquivo:** `components/ui/tabs.tsx`

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="history" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="weak-areas">Weak Areas</TabsTrigger>
    <TabsTrigger value="stats">Stats</TabsTrigger>
  </TabsList>
  <TabsContent value="history">
    <h2>Question History</h2>
    {/* Content */}
  </TabsContent>
  <TabsContent value="weak-areas">
    <h2>Weak Areas</h2>
    {/* Content */}
  </TabsContent>
</Tabs>
```

---

## Componentes Customizados

### 1. QuestionCard

**Arquivo:** `components/questions/question-card.tsx`

```typescript
interface QuestionCardProps {
  question: Question;
  compact?: boolean;
  onClick?: () => void;
}

export function QuestionCard({
  question,
  compact = false,
  onClick
}: QuestionCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        compact && 'p-3'
      )}
      onClick={onClick}
    >
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-start justify-between">
          <CardTitle className={compact ? 'text-base' : ''}>
            {question.questionText.slice(0, 50)}...
          </CardTitle>
          <ReputationBadge score={question.reputation.currentScore} />
        </div>
        <CardDescription className="text-xs">
          {question.examBoard} {question.examYear}
        </CardDescription>
      </CardHeader>
      {!compact && (
        <CardContent>
          <div className="space-y-1 text-sm">
            <p>A) {question.optionA.slice(0, 40)}...</p>
            <p>B) {question.optionB.slice(0, 40)}...</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
```

**Props:**

- `question` (required) - Dados da questão
- `compact` - Versão miniaturizada
- `onClick` - Handler para clique

---

### 2. QuestionDetail

**Arquivo:** `components/questions/question-detail.tsx`

```typescript
interface QuestionDetailProps {
  question: Question;
  onSubmit: (answer: string, timeMs: number) => Promise<void>;
  showCommentary?: boolean;
}

export function QuestionDetail({
  question,
  onSubmit,
  showCommentary = true
}: QuestionDetailProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    await onSubmit(selectedAnswer, Date.now() - startTime);
    setSubmitted(true);
    setIsCorrect(selectedAnswer === question.correctAnswer);
  };

  return (
    <Card className="p-6">
      {/* Header com reputation */}
      {/* Options como radio buttons */}
      {/* Submit button */}
      {/* Result feedback */}
      {/* Commentary se showCommentary */}
    </Card>
  );
}
```

---

### 3. ReputationBadge

**Arquivo:** `components/questions/reputation-badge.tsx`

```typescript
interface ReputationBadgeProps {
  score: number; // 0-10
  size?: 'sm' | 'md' | 'lg';
}

export function ReputationBadge({
  score,
  size = 'md'
}: ReputationBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={cn(
      'rounded-full font-semibold',
      getColor(score),
      sizes[size]
    )}>
      {score}/10
    </div>
  );
}
```

**Uso:**

```typescript
<ReputationBadge score={8} size="md" />
// Output: Badgecom fundo verde "8/10"
```

---

### 4. QuestionGeneratorForm

**Arquivo:** `components/questions/question-generator-form.tsx`

```typescript
export function QuestionGeneratorForm() {
  const form = useForm<QuestionGenerateInput>({
    resolver: zodResolver(QuestionGenerateSchema),
    defaultValues: { difficulty: 'medium', count: 5 }
  });

  const onSubmit = async (data: QuestionGenerateInput) => {
    const response = await fetch('/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Handle response
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="domain" />
        <FormField name="subject" />
        <FormField name="difficulty" />
        <FormField name="count" />
        <FormField name="preferReal" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Generating...' : 'Generate'}
        </Button>
      </form>
    </Form>
  );
}
```

---

### 5. FeedbackDialog

**Arquivo:** `components/questions/feedback-dialog.tsx`

```typescript
interface FeedbackDialogProps {
  questionId: string;
  onSubmit?: (feedback: FeedbackInput) => Promise<void>;
}

export function FeedbackDialog({
  questionId,
  onSubmit
}: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<FeedbackInput>({
    resolver: zodResolver(FeedbackSchema)
  });

  const handleSubmit = async (data: FeedbackInput) => {
    const response = await fetch(`/api/questions/${questionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response.ok) {
      setOpen(false);
      form.reset();
      // Show success toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a Problem</DialogTitle>
          <DialogDescription>
            Help us improve question quality
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incorrect_answer">
                        Incorrect Answer
                      </SelectItem>
                      <SelectItem value="unclear_wording">
                        Unclear Wording
                      </SelectItem>
                      <SelectItem value="legal_error">
                        Legal Error
                      </SelectItem>
                      <SelectItem value="typo">Typo</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Explain the problem..."
                      className="w-full rounded border p-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 6. DashboardStats

**Arquivo:** `components/dashboard/stats-card.tsx`

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'text-xs font-semibold mt-2',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Uso:
<StatsCard
  title="Questions Answered"
  value={42}
  description="Last 7 days"
  icon={<BookOpen className="h-4 w-4" />}
  trend={{ value: 5, direction: 'up' }}
/>
```

---

### 7. ExamAttempt

**Arquivo:** `components/exams/exam-attempt.tsx`

```typescript
interface ExamAttemptProps {
  examId: string;
  attemptId: string;
  onComplete: () => void;
}

export function ExamAttempt({
  examId,
  attemptId,
  onComplete
}: ExamAttemptProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = async (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [exam!.questions[currentQuestion].id]: answer
    }));

    if (currentQuestion < exam!.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleComplete = async () => {
    const response = await fetch(
      `/api/exams/${attemptId}/complete`,
      { method: 'PUT' }
    );
    const result = await response.json();
    onComplete();
  };

  return (
    <div>
      {/* Timer */}
      {/* Progress bar */}
      {/* Current question */}
      {/* Navigation buttons */}
      {/* Complete button */}
    </div>
  );
}
```

---

### 8. AdminReviewQueue

**Arquivo:** `components/admin/review-queue-item.tsx`

```typescript
interface ReviewQueueItemProps {
  feedback: QuestionFeedback;
  onReview: (decision: ReviewDecision, notes: string) => Promise<void>;
}

export function ReviewQueueItem({
  feedback,
  onReview
}: ReviewQueueItemProps) {
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async () => {
    setSubmitting(true);
    await onReview(decision!, notes);
    setSubmitting(false);
  };

  return (
    <Card className={cn(
      'p-4',
      feedback.isPriority && 'border-red-500 bg-red-50'
    )}>
      {/* Question preview */}
      {/* Feedback category + text */}
      {/* Report count */}
      {/* Decision form */}
      {/* Submit button */}
    </Card>
  );
}
```

---

## Padrões de Uso

### Padrão 1: Controlled Components

```typescript
// ❌ Evitar: uncontrolled
<Input defaultValue={domain} />

// ✅ Fazer: controlled
const [domain, setDomain] = useState('');
<Input value={domain} onChange={(e) => setDomain(e.target.value)} />
```

### Padrão 2: Composição com Children

```typescript
// ✅ Bom: Card é composável
<Card>
  <CardHeader>
    <CardTitle>Pergunta</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Custom content */}
  </CardContent>
</Card>
```

### Padrão 3: Slots com asChild

```typescript
// ✅ Bom: Dialog trigger pode ser qualquer elemento
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
</Dialog>
```

### Padrão 4: Form com React Hook Form

```typescript
// ✅ Padrão correto para formulários
const form = useForm({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="email" />
  </form>
</Form>
```

---

## Composição de Componentes

### Exemplo: Question Generator Page

```typescript
// pages/dashboard/questions/generate.tsx

'use client';

import { useState } from 'react';
import { QuestionGeneratorForm } from '@/components/questions/question-generator-form';
import { QuestionCard } from '@/components/questions/question-card';
import { Card, CardContent } from '@/components/ui/card';

export default function GenerateQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (params: GenerateQuestionInput) => {
    setLoading(true);
    const response = await fetch('/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    const data = await response.json();
    setQuestions(data.questions);
    setLoading(false);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Questions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div>
          <QuestionGeneratorForm onGenerate={handleGenerate} />
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading && <p>Generating...</p>}

          {questions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {questions.length} questions generated
              </p>
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onClick={() => navigate(`/dashboard/questions/${q.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Exemplo: Exam Review Page

```typescript
// pages/admin/review-queue.tsx

'use client';

import { useEffect, useState } from 'react';
import { AdminReviewQueue } from '@/components/admin/review-queue-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/dashboard/stats-card';

export default function ReviewQueuePage() {
  const [pending, setPending] = useState<QuestionFeedback[]>([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    const response = await fetch('/api/admin/review-queue');
    const data = await response.json();
    setPending(data.items);
    setStats(data.stats);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Review Queue</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatsCard title="Pending" value={stats?.pending} />
        <StatsCard title="Under Review" value={stats?.underReview} />
        <StatsCard title="Total" value={stats?.total} />
      </div>

      {/* Queue */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="priority">Priority</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pending.map((feedback) => (
              <AdminReviewQueue
                key={feedback.id}
                feedback={feedback}
                onReview={handleReview}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

**Próximo:** Leia [TESTES_EXEMPLOS.md](./TESTES_EXEMPLOS.md) para ver padrões de testes.
