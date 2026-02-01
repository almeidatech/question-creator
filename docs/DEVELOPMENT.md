# 📝 Guia de Desenvolvimento - Question Creator

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Convenções de Código](#convenções-de-código)
2. [Estrutura de Componentes](#estrutura-de-componentes)
3. [Padrões de Estado](#padrões-de-estado)
4. [Padrões de API](#padrões-de-api)
5. [Testes](#testes)
6. [Commits e PRs](#commits-e-prs)
7. [Performance](#performance)
8. [Segurança](#segurança)

---

## Convenções de Código

### TypeScript

**Sempre use tipos:**

```typescript
// ✅ BOM
interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const questions: Question[] = [];

// ❌ RUIM
const questions = [];  // any type
```

**Use Union Types para enums:**

```typescript
// ✅ BOM
type UserRole = 'student' | 'educator' | 'reviewer' | 'admin';

// ❌ RUIM
const ROLES = {
  STUDENT: 'student',
  EDUCATOR: 'educator'
};
```

**Nomeie tipos com prefixo `I` para interfaces:**

```typescript
// ✅ BOM (consistente)
interface IQuestion { ... }
interface IUser { ... }

// ❌ RUIM (inconsistente)
interface Question { ... }
type User = { ... }
```

### Nomes de Variáveis

```typescript
// ✅ BOM
const isLoading = true;
const handleSubmit = () => {};
const getQuestions = async () => {};
const MAX_RETRIES = 3;

// ❌ RUIM
const Loading = true;
const submit = () => {};
const questions = async () => {};
const maxRetries = 3;
```

**Padrão:**

- `is*` / `has*` → booleanos
- `handle*` → event handlers
- `get*` / `fetch*` → funções assíncronas
- `CONSTANT_NAME` → constantes
- `camelCase` → variáveis

### Formatação

```bash
# Prettier auto-formata
npm run format

# ESLint verifica qualidade
npm run lint

# Ambos em Git hooks (pre-commit)
```

**Configuração automática:**

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Estrutura de Componentes

### React Components

**Padrão de pasta:**

```text
components/
├── questions/
│   ├── QuestionDetail.tsx      # Main component
│   ├── QuestionDetail.test.tsx # Tests
│   └── QuestionDetail.module.css # Styles
```

**Template de componente:**

```typescript
// ✅ BOM
import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface IQuestionDetailProps {
  question: IQuestion;
  onSubmit: (answer: string) => Promise<void>;
  isLoading?: boolean;
}

export function QuestionDetail({
  question,
  onSubmit,
  isLoading = false,
}: IQuestionDetailProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selected) return;
    await onSubmit(selected);
  };

  return (
    <Card className="p-6">
      <h2>{question.text}</h2>
      {/* JSX content */}
    </Card>
  );
}

// ❌ RUIM
export default function QuestionDetail(props: any) {
  // Magic numbers
  // No types
  // Business logic no component
}
```

**Regras:**

- ✅ Nomeie arquivo com PascalCase: `QuestionDetail.tsx`
- ✅ Use `interface` para props
- ✅ Exporte como `export function` (não default)
- ✅ Coloque tipos em `/types` se reutilizado
- ❌ Não coloque lógica pesada no componente
- ❌ Não importe diretamente de `node_modules` (use barrel exports)

### Server Components (RSC)

```typescript
// ✅ BOM - Server Component para data fetching
export default async function Dashboard() {
  const user = await getUser();  // Chamada direta ao DB

  return (
    <div>
      <h1>Dashboard for {user.name}</h1>
      <QuestionList questions={user.questions} />  {/* Client component */}
    </div>
  );
}

// ✅ BOM - Client Component com interação
'use client';

export function QuestionList({ questions }: Props) {
  const [selected, setSelected] = useState(null);

  return (
    <div onClick={() => setSelected(...)}>
      {/* interativo */}
    </div>
  );
}
```

---

## Padrões de Estado

### Zustand (State Management)

**Arquivo exemplo:**

```typescript
// lib/stores/use-question-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IQuestionStore {
  // State
  questions: IQuestion[];
  isLoading: boolean;
  filters: IQuestionFilters;

  // Actions
  setQuestions: (questions: IQuestion[]) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<IQuestionFilters>) => void;
}

export const useQuestionStore = create<IQuestionStore>()(
  persist(
    (set) => ({
      // Initial state
      questions: [],
      isLoading: false,
      filters: {},

      // Actions
      setQuestions: (questions) => set({ questions }),
      setLoading: (loading) => set({ isLoading: loading }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
    }),
    {
      name: 'question-store',
      partialize: (state) => ({
        filters: state.filters, // Persist only filters
      }),
    }
  )
);
```

**Uso em componentes:**

```typescript
'use client';

export function QuestionFilter() {
  const { filters, setFilters } = useQuestionStore();

  return (
    <select
      value={filters.difficulty || ''}
      onChange={(e) => setFilters({ difficulty: e.target.value as any })}
    >
      <option value="">Todos</option>
      <option value="easy">Fácil</option>
      <option value="medium">Médio</option>
      <option value="hard">Difícil</option>
    </select>
  );
}
```

### Context API (Para providers globais)

```typescript
// contexts/auth-context.tsx
'use client';

interface IAuthContextType {
  user: IUser | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<IAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session: null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Padrões de API

### Server Actions (Form Handling)

```typescript
// app/dashboard/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateQuestionSchema = z.object({
  text: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export async function createQuestion(input: CreateQuestionInput) {
  try {
    // 1. Validar entrada
    const validated = CreateQuestionSchema.parse(input);

    // 2. Autenticar usuário
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');

    // 3. Executar operação
    const { data, error } = await supabase
      .from('questions')
      .insert({
        ...validated,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Revalidar cache
    revalidatePath('/dashboard');

    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

**Uso no componente:**

```typescript
// app/dashboard/form.tsx
'use client';

import { createQuestion } from './actions';

export function CreateQuestionForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createQuestion({
      text: formData.get('text') as string,
      difficulty: formData.get('difficulty') as any,
    });
    setLoading(false);

    if (result.success) {
      toast.success('Questão criada!');
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="text" required />
      <select name="difficulty">
        <option value="easy">Fácil</option>
      </select>
      <button disabled={loading}>Criar</button>
    </form>
  );
}
```

### API Routes (Backend)

```typescript
// app/api/questions/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 1. Validação
const GenerateSchema = z.object({
  domain: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(20),
});

// 2. Handler
export async function POST(request: NextRequest) {
  try {
    // Autenticar
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validar entrada
    const body = await request.json();
    const { domain, difficulty, count } = GenerateSchema.parse(body);

    // Rate limiting
    await checkRateLimit(session.user.id);

    // Lógica
    const questions = await generateQuestions({
      domain,
      difficulty,
      count,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Testes

### Unit Tests (Vitest)

```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAccuracy } from './utils';

describe('calculateAccuracy', () => {
  it('should return 100% for all correct answers', () => {
    const result = calculateAccuracy(10, 10);
    expect(result).toBe(1.0);
  });

  it('should return 0% for no correct answers', () => {
    const result = calculateAccuracy(0, 10);
    expect(result).toBe(0.0);
  });

  it('should handle edge case of 0 total', () => {
    const result = calculateAccuracy(0, 0);
    expect(result).toBe(0);
  });
});
```

### Component Tests (React Testing Library)

```typescript
// components/questions/QuestionDetail.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionDetail } from './QuestionDetail';

describe('QuestionDetail', () => {
  const mockQuestion = {
    id: '1',
    text: 'What is 2+2?',
    difficulty: 'easy',
    optionA: '3',
    optionB: '4',
    optionC: '5',
    optionD: '6',
    correctAnswer: 'b',
  };

  it('should render question text', () => {
    render(
      <QuestionDetail
        question={mockQuestion}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('should call onSubmit with selected answer', async () => {
    const mockSubmit = jest.fn();
    render(
      <QuestionDetail
        question={mockQuestion}
        onSubmit={mockSubmit}
      />
    );

    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Submit'));

    expect(mockSubmit).toHaveBeenCalledWith('b');
  });
});
```

**Executar testes:**

```bash
# Todos os testes
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Commits e PRs

### Mensagens de Commit

**Padrão Conventional Commits:**

```bash
# Formato
<type>(<scope>): <subject>

# Tipos
feat:     Nova feature
fix:      Bug fix
refactor: Refatoração sem mudança de comportamento
perf:     Melhoria de performance
test:     Testes
docs:     Documentação
style:    Formatação (não afeta código)
chore:    Manutenção

# Exemplos
git commit -m "feat(questions): add AI generation with RAG"
git commit -m "fix(auth): resolve JWT token expiration"
git commit -m "docs(api): update endpoint documentation"
```

### Pull Request

**Template:**

```markdown
## Descrição
Brief description of changes

## Tipo
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation

## Checklist
- [ ] Tests passing
- [ ] No console errors
- [ ] Updated documentation
- [ ] Reviewed by at least 1 person

## Screenshots (if applicable)
Attach images for UI changes

## Related Issues
Closes #123
```

**Workflow:**

1. Crie branch: `git checkout -b feat/feature-name`
2. Faça commits pequenos e claros
3. Teste localmente: `npm run test && npm run build`
4. Push: `git push origin feat/feature-name`
5. Abra PR no GitHub
6. Aguarde 1 review aprovado
7. Merge e delete branch

---

## Performance

### Otimizações Next.js

**1. Image Optimization:**

```typescript
import Image from 'next/image';

// ✅ BOM
<Image
  src="/questions.png"
  alt="Question example"
  width={400}
  height={300}
  priority={false}
/>

// ❌ RUIM
<img src="/questions.png" />
```

**2. Code Splitting:**

```typescript
import dynamic from 'next/dynamic';

const QuestionList = dynamic(
  () => import('./QuestionList'),
  { loading: () => <Skeleton /> }
);
```

**3. Memoization:**

```typescript
const QuestionCard = memo(function QuestionCard({ question }: Props) {
  return <div>{question.text}</div>;
});
```

### Database Performance

```sql
-- ✅ BOM - Use índices
CREATE INDEX idx_questions_domain ON questions(domain_id);
CREATE INDEX idx_history_user_date ON user_question_history(user_id, attempted_at DESC);

-- ✅ BOM - Select apenas colunas necessárias
SELECT id, text, difficulty FROM questions WHERE domain_id = ?

-- ❌ RUIM - Select *
SELECT * FROM questions WHERE domain_id = ?

-- ✅ BOM - Use LIMIT para grandes datasets
SELECT * FROM questions LIMIT 100 OFFSET 0

-- ❌ RUIM - Sem paginação
SELECT * FROM questions  -- 13,917 registros!
```

---

## Segurança

### Validação de Entrada

```typescript
// ✅ BOM
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validated = UserInputSchema.parse(input);

// ❌ RUIM
const user = { email: input.email, password: input.password };
```

### Sanitização

```typescript
// ✅ BOM
import DOMPurify from 'isomorphic-dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);

// ❌ RUIM
dangerouslySetInnerHTML={{ __html: userInput }}
```

### Variáveis Sensíveis

```typescript
// ✅ BOM - Em .env.local (não commit)
ANTHROPIC_API_KEY=sk-ant-xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxx

// ❌ RUIM - Hardcoded
const API_KEY = 'sk-ant-xxxxx';
```

### Autenticação

```typescript
// ✅ BOM - Cheque auth em server actions
'use server';

export async function deleteQuestion(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email?.endsWith('@admin.com')) {
    throw new Error('Unauthorized');
  }
  // ... continue
}

// ❌ RUIM - Sem validação
export async function deleteQuestion(id: string) {
  await db.delete(id);  // Qualquer um pode deletar!
}
```

---

## Linting e Formatting

### Pré-commit Hooks (Husky)

```bash
# Instale uma vez
npm install husky --save-dev
npx husky install

# Cria hooks
npx husky add .husky/pre-commit "npm run lint && npm run format"
```

**Resultado:** Commit bloqueado se lint/format falhar

---

## Debugging

### Browser DevTools

```typescript
// ✅ BOM - Use console estruturado
console.group('Question Generation');
console.log('Input:', { domain, difficulty });
console.log('Output:', questions);
console.log('Time:', performance.now());
console.groupEnd();

// ✅ BOM - Use console.table para arrays
console.table(questions);

// ❌ RUIM
console.log(questions);  // Output feio
```

### React DevTools

- Instale extensão do Chrome
- Inspecione componentes
- Veja estado em tempo real

### Supabase Studio

- <http://localhost:54322>
- Query executadas
- Realtime updates
- Logs de erro

---

## Checklist para PR

```markdown
- [ ] Código segue convenções do projeto
- [ ] Tests foram adicionados para nova lógica
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` bem-sucedido
- [ ] `npm run test` tudo passa
- [ ] Documentação atualizada
- [ ] Nenhuma variável sensível commitada
- [ ] Performance não degradou
- [ ] Mobile responsive (se UI)
```

---

**Próximo:** Comece desenvolvendo! Use [SETUP_LOCAL.md](./SETUP_LOCAL.md) para setup.
