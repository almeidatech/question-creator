# 📘 TypeScript Types Guide

## Auto-Generated Database Types

O projeto gera tipos TypeScript automaticamente a partir do schema do banco de dados Supabase.

---

## 🔄 Regenerar Tipos

Quando o schema do banco mudar, regenere os tipos:

```bash
npm run gen:types
```

Isso criará/atualizará `src/database/database.types.ts` com os tipos mais recentes.

---

## 📖 Como Usar

### 1. **Importar tipos**

```typescript
import type { Database, Tables } from '@/database/database.types'
```

### 2. **Usar tipos de tabelas**

#### Opção A: Tipo genérico (recomendado)
```typescript
// Tipo da tabela users
type User = Tables<'users'>

// Tipo da tabela questions
type Question = Tables<'questions'>
```

#### Opção B: Tipo completo
```typescript
// Objeto completo com Row, Insert, Update
type UserTable = Database['public']['Tables']['users']

// Apenas Row
type UserRow = Database['public']['Tables']['users']['Row']

// Apenas Insert
type UserInsert = Database['public']['Tables']['users']['Insert']

// Apenas Update
type UserUpdate = Database['public']['Tables']['users']['Update']
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Query de usuários

```typescript
import type { Tables } from '@/database/database.types'
import { createClient } from '@supabase/supabase-js'

type User = Tables<'users'>

const supabase = createClient(url, key)

async function getUser(id: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  return data
}
```

### Exemplo 2: Inserir questão

```typescript
import type { Database } from '@/database/database.types'

type QuestionInsert = Database['public']['Tables']['questions']['Insert']

async function createQuestion(q: QuestionInsert) {
  const { data, error } = await supabase
    .from('questions')
    .insert([q])
    .select()

  if (error) throw error
  return data[0]
}

// Uso
createQuestion({
  question_bank_version_id: '123',
  question_text: 'O que é TypeScript?',
  option_a: 'Um superset de JavaScript',
  option_b: 'Uma linguagem de programação',
  option_c: 'Um compilador',
  correct_answer: 'a',
  difficulty: 'easy',
  source_type: 'real_exam'
})
```

### Exemplo 3: Atualizar usuário

```typescript
import type { Database } from '@/database/database.types'

type UserUpdate = Database['public']['Tables']['users']['Update']

async function updateUser(id: string, updates: UserUpdate) {
  const { data } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return data
}

// Uso - todos os campos são opcionais
updateUser('user-123', {
  full_name: 'João Silva',
  avatar_url: 'https://...'
  // O TypeScript garante que só campos válidos podem ser passados
})
```

### Exemplo 4: RPC Functions

```typescript
import type { Database } from '@/database/database.types'

// Chamar função get_import_progress
const { data } = await supabase.rpc('get_import_progress', {
  p_import_id: 'import-123'
})

// Chamar função get_import_history
const { data: history } = await supabase.rpc('get_import_history', {
  p_admin_id: userId,
  p_limit: 10
})

// Chamar função refresh_admin_dashboard_stats
await supabase.rpc('refresh_admin_dashboard_stats')
```

### Exemplo 5: React Component com tipos

```typescript
import { useEffect, useState } from 'react'
import type { Tables } from '@/database/database.types'
import { supabase } from '@/lib/supabase'

type Question = Tables<'questions'>

export function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(10)

      if (!error) {
        setQuestions(data)
      }
      setLoading(false)
    }

    loadQuestions()
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.question_text}</p>
          <p>Dificuldade: {q.difficulty}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 📊 Tipos de Tabelas Disponíveis

| Tabela | Colunas | Propósito |
|--------|---------|----------|
| `users` | 10 | Usuários do sistema |
| `questions` | 14 | Questões (13.9k + geradas) |
| `user_question_history` | 9 | Histórico de respostas |
| `exams` | 7 | Provas customizadas |
| `user_exam_attempts` | 7 | Tentativas de prova |
| `question_feedback` | 10 | Feedback de usuários |
| `question_imports` | 13 | Rastreamento de imports |
| `question_sources` | 7 | RAG isolation (novo) |
| ... | ... | ... |

---

## 🔧 Funções RPC Disponíveis

```typescript
// Get import progress
supabase.rpc('get_import_progress', { p_import_id: string })

// Rollback import
supabase.rpc('rollback_import', { p_import_id: string })

// Get import history
supabase.rpc('get_import_history', {
  p_admin_id: string,
  p_limit?: number
})

// Refresh dashboard stats
supabase.rpc('refresh_admin_dashboard_stats', {})
```

---

## ⚙️ Enums Tipados

```typescript
import type { Database } from '@/database/database.types'

// Import status
type ImportStatus = Database['public']['Enums']['import_status_enum']
// 'queued' | 'in_progress' | 'completed' | 'failed' | 'rollback'

// Source type
type SourceType = Database['public']['Enums']['source_type_enum']
// 'real_exam' | 'ai_generated' | 'expert_approved'
```

---

## 📝 Padrão de Type-Safe Queries

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Tables, Database } from '@/database/database.types'

type User = Tables<'users'>
type QuestionInsert = Database['public']['Tables']['questions']['Insert']

// ✅ Type-safe query
const query = supabase
  .from('users')
  .select('id, email, full_name') // ✅ TypeScript valida os campos
  .eq('is_active', true)

// ❌ Isto causaria erro de TypeScript:
// .select('id, invalid_field') // Campo não existe!
```

---

## 🔄 Mantendo Tipos Atualizados

### Fluxo de trabalho:

1. **Após alterar o schema Supabase**:
   ```bash
   npm run gen:types
   ```

2. **Commit dos tipos**:
   ```bash
   git add src/database/database.types.ts
   git commit -m "chore: update database types"
   ```

3. **Use nos componentes**:
   ```typescript
   import type { Tables } from '@/database/database.types'
   type MyType = Tables<'my_table'>
   ```

---

## 🐛 Troubleshooting

### Tipos desatualizados
```bash
npm run gen:types
```

### Campo não aparece no autocomplete
- Regenere os tipos com `npm run gen:types`
- Reinicie o TypeScript server no seu editor

### RPC function não tem tipos
- Edite `scripts/gen-types-from-sql.js`
- Adicione a função na seção `Functions`
- Regenere com `npm run gen:types`

---

## 💾 Salvando tipos em git

Sempre faça commit do arquivo `src/database/database.types.ts`:

```bash
git add src/database/database.types.ts
git commit -m "chore: update database types after schema changes"
```

---

## 📚 Recursos

- [Supabase TypeScript Guide](https://supabase.com/docs/reference/javascript/typescript-support)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✨ Benefícios

✅ **Type-safe queries** - Erros em tempo de compilação, não em runtime
✅ **Autocomplete** - Seu editor sugere campos válidos
✅ **Refactoring seguro** - Renomear colunas é seguro
✅ **Documentação** - Os tipos são a documentação
✅ **Menos bugs** - Não há mais strings mágicas
