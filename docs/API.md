# 🔌 API Reference - Question Creator

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Base URL](#base-url)
2. [Autenticação](#autenticação)
3. [Rate Limiting](#rate-limiting)
4. [Questões](#questões)
5. [Exames](#exames)
6. [Admin](#admin)
7. [Erros](#erros)
8. [Exemplos cURL](#exemplos-curl)

---

## Base URL

```text
Development:  http://localhost:3000/api
Production:   https://question-creator.vercel.app/api
```

---

## Autenticação

### Supabase JWT

Todas as requisições requerem autenticação via Bearer token (JWT):

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.example.com/api/questions/generate
```

### Obtendo Token

```typescript
// Frontend
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Header
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
| --- | --- | --- |
| `POST /questions/generate` | 10 | 1 minuto |
| `POST /questions/[id]/submit` | 60 | 1 minuto |
| `POST /questions/feedback` | 5 | 1 minuto |
| `POST /import/csv` | 1 | 1 minuto |
| `POST /exams` | 20 | 1 minuto |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706710800
```

Quando limite excedido → **429 Too Many Requests**

---

## Questões

### 1. Gerar Questões

**Endpoint:** `POST /api/questions/generate`

**Autenticação:** ✅ Requerida (Bearer Token)

**Body:**

```json
{
  "domain": "constitucional",
  "subject": "direitos-fundamentais",
  "topics": ["direitos-individuais"],
  "difficulty": "medium",
  "count": 10,
  "preferReal": true
}
```

**Campos:**

| Campo | Tipo | Required | Descrição |
| --- | --- | --- | --- |
| `domain` | string | ✅ | 'constitucional', 'administrativo', etc |
| `subject` | string | ✅ | Assunto dentro do domínio |
| `topics` | array | ❌ | UUIDs de tópicos específicos |
| `difficulty` | enum | ✅ | 'easy', 'medium', 'hard' |
| `count` | number | ❌ | 1-20, default 5 |
| `preferReal` | boolean | ❌ | Priorizar questões reais, default true |

**Response:** `200 OK`

```json
{
  "questions": [
    {
      "id": "uuid",
      "questionText": "A Constituição Federal...",
      "optionA": "...",
      "optionB": "...",
      "optionC": "...",
      "optionD": "...",
      "optionE": "...",
      "correctAnswer": "a",
      "difficulty": "medium",
      "sourceType": "real_exam",
      "examBoard": "CESPE",
      "examYear": 2022,
      "reputation": {
        "currentScore": 10,
        "status": "active"
      }
    }
  ],
  "stats": {
    "total": 10,
    "realExam": 7,
    "aiGenerated": 3
  }
}
```

**Errors:**

| Status | Erro | Solução |
| --- | --- | --- |
| 400 | Missing required fields | Verifique domain, subject, difficulty |
| 401 | Unauthorized | Inclua Bearer token válido |
| 429 | Rate limit exceeded | Aguarde antes de próxima requisição |
| 500 | Server error | Tente novamente, contate suporte |

---

### 2. Submeter Resposta

**Endpoint:** `POST /api/questions/{id}/submit`

**Autenticação:** ✅ Requerida

**Params:**

- `id` (string, UUID) - ID da questão

**Body:**

```json
{
  "selectedAnswer": "a",
  "responseTimeMs": 5230,
  "sessionId": "uuid",
  "context": "practice"
}
```

**Campos:**

| Campo | Tipo | Required | Descrição |
| --- | --- | --- | --- |
| `selectedAnswer` | enum | ✅ | 'a', 'b', 'c', 'd', 'e' |
| `responseTimeMs` | number | ✅ | Tempo em ms para responder |
| `sessionId` | string | ❌ | UUID para agrupar tentativas |
| `context` | enum | ❌ | 'practice', 'exam_simulation', 'weak_area_focus' |

**Response:** `200 OK`

```json
{
  "isCorrect": true,
  "correctAnswer": "a",
  "commentary": "A resposta correta é 'A' porque...",
  "stats": {
    "topicAccuracy": 0.62,
    "totalAttempts": 15,
    "correctAttempts": 9
  }
}
```

**Errors:**

| Status | Erro |
| --- | --- |
| 404 | Question not found |
| 400 | Invalid selectedAnswer |
| 401 | Unauthorized |

---

### 3. Buscar Questão

**Endpoint:** `GET /api/questions/{id}`

**Autenticação:** ✅ Requerida

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "questionText": "...",
  "optionA": "...",
  "optionB": "...",
  "optionC": "...",
  "optionD": "...",
  "optionE": "...",
  "correctAnswer": "a",
  "commentary": "...",
  "difficulty": "medium",
  "sourceType": "real_exam",
  "reputation": {
    "currentScore": 9,
    "totalAttempts": 342,
    "correctAttempts": 245
  }
}
```

---

### 4. Buscar Questões

**Endpoint:** `GET /api/questions`

**Autenticação:** ✅ Requerida

**Query Params:**

```text
/api/questions?domain=constitucional&subject=direitos-fundamentais&difficulty=medium&limit=50&offset=0
```

| Param | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| `domain` | string | - | Filtrar por domínio |
| `subject` | string | - | Filtrar por assunto |
| `difficulty` | enum | - | 'easy', 'medium', 'hard' |
| `search` | string | - | Busca full-text |
| `limit` | number | 20 | Quantidade (max 100) |
| `offset` | number | 0 | Paginação |

**Response:** `200 OK`

```json
{
  "questions": [...],
  "total": 1234,
  "page": 0,
  "pageSize": 20,
  "hasMore": true
}
```

---

### 5. Reportar Problema

**Endpoint:** `POST /api/questions/{id}/feedback`

**Autenticação:** ✅ Requerida

**Body:**

```json
{
  "category": "incorrect_answer",
  "text": "A resposta correta deveria ser C, não A, porque..."
}
```

**Campos:**

| Campo | Tipo | Required | Valores |
| --- | --- | --- | --- |
| `category` | enum | ✅ | 'incorrect_answer', 'unclear_wording', 'legal_error', 'typo', 'outdated_law', 'other' |
| `text` | string | ✅ | 20-500 caracteres |

**Response:** `201 Created`

```json
{
  "id": "feedback-uuid",
  "status": "pending",
  "submittedAt": "2026-01-31T10:00:00Z",
  "message": "Obrigado! Sua sugestão será revisada por nossos especialistas."
}
```

**Errors:**

| Status | Erro |
| --- | --- |
| 400 | Text too short (min 20 chars) |
| 400 | Invalid category |
| 401 | Unauthorized |

---

## Exames

### 1. Criar Exame

**Endpoint:** `POST /api/exams`

**Autenticação:** ✅ Requerida (role: educator+)

**Body:**

```json
{
  "title": "Simulado OAB - Direito Constitucional",
  "description": "30 questões sobre direitos fundamentais",
  "instructions": "Tempo: 60 minutos. Marque a resposta clicando...",
  "timeLimitMinutes": 60,
  "passingScorePercentage": 70,
  "shuffleQuestions": true,
  "shuffleAnswers": true,
  "showCorrectAnswers": true,
  "questionIds": ["uuid-1", "uuid-2", "..."]
}
```

**Response:** `201 Created`

```json
{
  "id": "exam-uuid",
  "title": "Simulado OAB...",
  "status": "draft",
  "questionCount": 30,
  "createdAt": "2026-01-31T10:00:00Z"
}
```

---

### 2. Iniciar Tentativa de Exame

**Endpoint:** `POST /api/exams/{id}/attempts`

**Autenticação:** ✅ Requerida

**Response:** `201 Created`

```json
{
  "attemptId": "attempt-uuid",
  "examId": "exam-uuid",
  "startedAt": "2026-01-31T10:00:00Z",
  "timeLimit": 3600,
  "questions": [
    { "id": "q1", "questionText": "...", "options": {...} },
    { "id": "q2", "questionText": "...", "options": {...} }
  ]
}
```

---

### 3. Submeter Resposta da Prova

**Endpoint:** `POST /api/exams/{attemptId}/answers`

**Body:**

```json
{
  "questionId": "q1",
  "selectedAnswer": "a",
  "responseTimeMs": 3500
}
```

**Response:** `200 OK`

```json
{
  "answered": true,
  "questionNumber": 1,
  "totalQuestions": 30
}
```

---

### 4. Finalizar Exame

**Endpoint:** `PUT /api/exams/{attemptId}/complete`

**Body:**

```json
{
  "isCompleted": true
}
```

**Response:** `200 OK`

```json
{
  "id": "attempt-uuid",
  "totalQuestions": 30,
  "correctAnswers": 24,
  "scorePercentage": 80,
  "passed": true,
  "completedAt": "2026-01-31T11:00:00Z"
}
```

---

## Admin

### 1. Importar CSV

**Endpoint:** `POST /api/admin/import/csv`

**Autenticação:** ✅ Requerida (role: admin)

**Content-Type:** `multipart/form-data`

**Form Data:**

```text
file: [questões.csv] (max 50MB)
domainId: "uuid"
versionNumber: 1
```

**Response:** `200 OK`

```json
{
  "success": true,
  "stats": {
    "total": 13917,
    "imported": 13892,
    "duplicates": 23,
    "failed": 2
  },
  "errors": [
    { "line": 145, "error": "Invalid format" }
  ]
}
```

---

### 2. Fila de Revisão

**Endpoint:** `GET /api/admin/review-queue`

**Autenticação:** ✅ Requerida (role: reviewer+)

**Query Params:**

```text
/api/admin/review-queue?status=pending&limit=20&sort=-created_at
```

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "q-uuid",
      "questionText": "...",
      "feedbackCount": 3,
      "reportedProblems": [
        { "category": "incorrect_answer", "text": "..." }
      ],
      "isHighPriority": true,
      "reportedAt": "2026-01-31T08:00:00Z"
    }
  ],
  "total": 5,
  "pending": 3,
  "underReview": 2
}
```

---

### 3. Revisar Questão

**Endpoint:** `POST /api/admin/reviews`

**Autenticação:** ✅ Requerida (role: reviewer+)

**Body:**

```json
{
  "questionId": "q-uuid",
  "decision": "approve",
  "notes": "Questão clara, resposta correta, legal e apropriada."
}
```

**Campos:**

| Campo | Tipo | Required | Valores |
| --- | --- | --- | --- |
| `questionId` | string | ✅ | UUID |
| `decision` | enum | ✅ | 'approve', 'request_revision', 'reject' |
| `notes` | string | ❌ | Feedback detalhado |

**Response:** `201 Created`

```json
{
  "id": "review-uuid",
  "decision": "approve",
  "reputation": {
    "before": 0,
    "after": 7
  },
  "reviewedAt": "2026-01-31T10:00:00Z"
}
```

---

### 4. Dashboard Admin

**Endpoint:** `GET /api/admin/dashboard`

**Autenticação:** ✅ Requerida (role: admin)

**Response:** `200 OK`

```json
{
  "stats": {
    "totalUsers": 342,
    "activeUsers24h": 89,
    "totalQuestions": 13950,
    "questionsThisWeek": 12,
    "avgResponseTime": 4.2,
    "systemUptime": 99.98
  },
  "recentActivity": [
    { "type": "user_signup", "timestamp": "..." },
    { "type": "question_generated", "timestamp": "..." }
  ]
}
```

---

## Erros

### Formato de Erro

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: domain",
    "details": {
      "field": "domain",
      "received": null
    }
  }
}
```

### Códigos de Erro Comuns

| Código | HTTP | Descrição |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Token inválido ou expirado |
| `FORBIDDEN` | 403 | Sem permissão (role insuficiente) |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos |
| `RATE_LIMITED` | 429 | Limite de requisições excedido |
| `DATABASE_ERROR` | 500 | Erro no banco de dados |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

---

## Exemplos cURL

### Gerar Questões

```bash
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "constitucional",
    "subject": "direitos-fundamentais",
    "difficulty": "medium",
    "count": 5
  }'
```

### Submeter Resposta

```bash
curl -X POST http://localhost:3000/api/questions/UUID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedAnswer": "a",
    "responseTimeMs": 5000
  }'
```

### Buscar Questões

```bash
curl -X GET 'http://localhost:3000/api/questions?domain=constitucional&difficulty=medium&limit=10' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Reportar Problema

```bash
curl -X POST http://localhost:3000/api/questions/UUID/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "incorrect_answer",
    "text": "A resposta correta deveria ser B porque..."
  }'
```

### Importar CSV (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/import/csv \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "file=@questoes.csv" \
  -F "domainId=UUID" \
  -F "versionNumber=1"
```

### Revisar Questão (Reviewer)

```bash
curl -X POST http://localhost:3000/api/admin/reviews \
  -H "Authorization: Bearer REVIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "UUID",
    "decision": "approve",
    "notes": "Questão clara e precisa."
  }'
```

---

## Webhooks (Futuros)

Planejamos adicionar webhooks para:

- Nova questão criada
- Feedback enviado
- Review completo
- Exame concluído

**Versão:** 2.0+

---

**Próximo:** Leia [DEVELOPMENT.md](./DEVELOPMENT.md) para convenções de código.
