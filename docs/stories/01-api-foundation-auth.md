# US-1.1: API Foundation & Authentication

**Epic:** Epic 1 - Core Features
**Sprint:** 1.1 / Week 2
**Effort:** 22h
**Assigned to:** @dev, @architect
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** user of Question Creator
**I want** to securely sign up, log in, and maintain authenticated sessions
**So that** my data and progress are protected and persisted across visits

---

## Acceptance Criteria

- [ ] `POST /api/auth/signup` - User can register with email + password
  - Validates email format (RFC 5322)
  - Hashes password with bcrypt (min 12 rounds)
  - Creates user record in Supabase
  - Sends verification email
  - Returns JWT token + refresh token
  - Status: 201 Created on success, 400 on validation error, 409 if email exists

- [ ] `POST /api/auth/login` - User can log in with email + password
  - Validates credentials against stored hash
  - Returns JWT (exp: 24h) + refresh token (exp: 7d)
  - Sets user_id in Supabase RLS context
  - Rate limited: 10 attempts/minute per IP
  - Status: 200 OK on success, 401 on invalid credentials

- [ ] Auth Middleware - Validates JWT on all protected routes
  - Checks token signature + expiry
  - Extracts user_id and propagates to RLS context
  - Returns 401 if token invalid/expired
  - Supports token refresh endpoint

- [ ] RLS Policies - Row-level security enforced
  - Users can only access own data (user_id match)
  - Test with role impersonation (can't access other user's data)
  - Applied to: users, user_question_history, exams, exam_attempts

---

## Definition of Done

- [ ] Both endpoints (signup/login) tested with Vitest (happy path + error cases)
- [ ] RLS policies applied and verified with role impersonation
- [ ] Rate limiting working (verified with load test: 11th request blocked)
- [ ] JWT tokens valid for 24h, refresh tokens for 7d
- [ ] Password hashing confirmed (bcrypt, min 12 rounds)
- [ ] Documentation: API contract (OpenAPI spec), setup instructions, RLS model
- [ ] No hardcoded secrets in code (use .env.local)
- [ ] All tests passing (Vitest coverage ≥ 80%)

---

## Technical Specifications

### Endpoints

```typescript
POST /api/auth/signup
{
  email: "user@example.com",
  password: "SecurePassword123!"
}
// Response 201:
{
  user_id: "uuid",
  email: "user@example.com",
  access_token: "jwt...",
  refresh_token: "jwt...",
  token_type: "Bearer",
  expires_in: 86400
}

POST /api/auth/login
{
  email: "user@example.com",
  password: "SecurePassword123!"
}
// Response 200:
{
  user_id: "uuid",
  access_token: "jwt...",
  refresh_token: "jwt...",
  token_type: "Bearer",
  expires_in: 86400
}
```

### Validation Schema (Zod)

```typescript
const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password min 8 chars")
    .regex(/[A-Z]/, "Needs uppercase")
    .regex(/[0-9]/, "Needs number")
    .regex(/[!@#$%^&*]/, "Needs special char")
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required")
});
```

### RLS Policy Example

```sql
-- Users can only see their own data
CREATE POLICY user_isolation ON users
  USING (auth.uid() = id);

-- Users can only access their question history
CREATE POLICY question_history_isolation ON user_question_history
  USING (user_id = auth.uid());
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Security scan: No SQL injection (parameterized queries only)
- [ ] OWASP check: No hardcoded secrets, auth bypass
- [ ] Input validation: All fields validated with Zod
- [ ] RLS test: Verify role isolation (test with different user_id)

### Pre-PR

- [ ] JWT token expiry tests (token valid for 24h exactly)
- [ ] Rate limit verification (10 req/min enforced)
- [ ] @architect security review of RLS policies
- [ ] Password hashing verified (bcrypt 12+ rounds)

### Pre-Deployment

- [ ] E2E test: signup → login → access protected route → verify user_id
- [ ] Smoke test on staging environment
- [ ] Monitor auth error rates in Sentry

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| RLS policies misconfigured → data leak | Security audit week 2, test RLS with impersonation |
| Rate limit bypass | Redis-backed rate limit, gradually increase 10→100 req/min |
| Weak password hashing | Use bcrypt 12+ rounds, never use MD5/SHA1 |
| JWT secret exposed | Use .env.local (git-ignored), rotate in production |

---

## Dependencies

- [ ] Supabase project configured (database schema ready)
- [ ] Environment variables set (.env.example provided)
- [ ] Node.js 18+ / npm 9+
- No blocking dependencies from other stories

---

## Implementation Checklist

- [ ] Create auth service module
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Setup JWT token generation/validation
- [ ] Create RLS policies in database
- [ ] Add rate limiting middleware
- [ ] Write unit tests for auth functions
- [ ] Write integration tests for endpoints
- [ ] Document API contract
- [ ] Setup monitoring/logging

---

**Created:** 2026-02-01
**Next Story:** [02-question-generation-rag.md](./02-question-generation-rag.md)
