# 🔐 Flow 1: Signup & Authentication

**Timeline:** Week 1-2 | **Priority:** 🔴 CRITICAL | **Screens:** 3

---

## 📊 Flow Overview

```
┌─────────────────────────────────────┐
│  SCREEN 1.1: Signup Form            │
│  (Email, Password, Confirm)         │
└────────────────┬────────────────────┘
                 │ Valid form + submit
                 ▼
┌─────────────────────────────────────┐
│  SCREEN 1.2: Email Verification     │
│  (6-digit code or email link)       │
└────────────────┬────────────────────┘
                 │ Email verified
                 ▼
┌─────────────────────────────────────┐
│  SCREEN 1.3: Complete Profile       │
│  (Avatar, Name, Domain Selection)   │
└────────────────┬────────────────────┘
                 │ Profile complete
                 ▼
        Dashboard (logged in)
```

---

## 🎨 Screen 1.1: Signup Form

### Visual Structure

```
┌─────────────────────────────────────┐
│  Header                             │
│  "Create Your Account"              │
│  "Join Question Creator"            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Email Input                     ││
│  │ ________@_______.___            ││
│  │ Required error: "Enter email"   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Password Input                  ││
│  │ ••••••••••                      ││
│  │ Hint: Minimum 8 characters      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Confirm Password Input          ││
│  │ ••••••••••                      ││
│  │ Error: "Passwords don't match"  ││
│  └─────────────────────────────────┘│
│                                     │
│  ☐ I agree to Terms & Privacy      │
│  > Link to Terms                    │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [Sign Up Button - Primary]     ││
│  │  (disabled until form valid)    ││
│  └─────────────────────────────────┘│
│                                     │
│  Already have an account?           │
│  > Sign In                          │
└─────────────────────────────────────┘
```

### Components Used

| Component | Type | Count | Purpose |
|-----------|------|-------|---------|
| **FormField** | Molecule | 3 | Email, password, confirm |
| **Input** | Atom | 3 | Text inputs |
| **Checkbox** | Atom | 1 | Agree to terms |
| **Label** | Atom | 4 | All form labels |
| **Button** | Atom | 1 | Sign up button (primary) |
| **Text** | Atom | 5+ | Headings, hints, errors |
| **Link** | Atom | 2 | Terms & sign in link |

### State Management

```typescript
interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  loading: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}
```

### Form Validation Rules

1. **Email**
   - ✅ Valid email format (user@domain.com)
   - ❌ Already registered
   - Error: "Invalid email" or "Email already registered"

2. **Password**
   - ✅ Minimum 8 characters
   - ✅ At least 1 uppercase letter
   - ✅ At least 1 number
   - Error: "Password too weak"

3. **Confirm Password**
   - ✅ Must match password
   - Error: "Passwords don't match"

4. **Terms**
   - ✅ Must be checked
   - Error: "You must agree to terms"

### API Interaction

```typescript
// POST /api/auth/signup
{
  email: "user@example.com",
  password: "SecurePass123",
  agreeToTerms: true
}

// Response 200 OK
{
  success: true,
  message: "Verification email sent",
  userId: "uuid",
  requiresEmailVerification: true
}

// Response 400 Bad Request
{
  error: "Email already registered"
}
```

### User Actions

- ✅ Type email
- ✅ Type password
- ✅ Type confirm password
- ✅ Check "agree to terms" checkbox
- ✅ Click "Sign Up" button
- ✅ Click "Sign In" to go back to login
- ✅ Click "Terms" to read terms

---

## 🎨 Screen 1.2: Email Verification

### Visual Structure

```
┌─────────────────────────────────────┐
│  Header                             │
│  "Verify Your Email"                │
│  "We sent a verification link to    │
│   user@example.com"                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [6] [6] [6] [6] [6] [6]        ││  6-digit code input
│  │ Code auto-focuses first digit   ││
│  │ Supports paste (XXXXXX)         ││
│  └─────────────────────────────────┘│
│                                     │
│  OR click link in your email        │
│  (Auto-proceed when link clicked)   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [Verify Button - Primary]      ││
│  │  (disabled until 6 digits)      ││
│  └─────────────────────────────────┘│
│                                     │
│  Didn't receive code?               │
│  Resend in 60s                      │
│  > Resend Code (disabled)           │
│                                     │
│  > Wrong email? Change email        │
└─────────────────────────────────────┘
```

### Components Used

| Component | Type | Count | Purpose |
|-----------|------|-------|---------|
| **Input** | Atom | 6 or 1 | Verification code |
| **Button** | Atom | 1 | Verify button (primary) |
| **Button** | Atom | 1 | Resend code (secondary, disabled) |
| **Text** | Atom | 5+ | Status text, countdown, hints |
| **Link** | Atom | 1 | Change email link |

### State Management

```typescript
interface EmailVerificationState {
  code: string;  // 6 characters
  loading: boolean;
  error?: string;
  resendCountdown: number;  // 60 seconds
  canResend: boolean;
  verified: boolean;
}
```

### Form Validation

1. **Code**
   - ✅ Exactly 6 digits
   - ✅ Valid code (check against DB)
   - ❌ Expired code (>15 minutes old)
   - Error: "Invalid code" or "Code expired"

### API Interaction

```typescript
// POST /api/auth/verify-email
{
  code: "123456"
}

// Response 200 OK
{
  success: true,
  message: "Email verified",
  nextStep: "completeProfile"
}

// OR auto-verify when clicking email link
// GET /api/auth/verify-email?token=xxx
```

### User Actions

- ✅ Type 6-digit code (auto-focus per digit)
- ✅ Paste full code (XXXXXX)
- ✅ Click "Verify" button
- ✅ Wait for countdown, then click "Resend Code"
- ✅ Click email link to auto-verify
- ✅ Click "Change email" to go back

---

## 🎨 Screen 1.3: Complete Profile

### Visual Structure

```
┌─────────────────────────────────────┐
│  Header                             │
│  "Complete Your Profile"            │
│  "Let's personalize your learning"  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Avatar Image]  [Upload Button] ││
│  │ Optional - you can add later     ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Full Name Input                 ││
│  │ João Silva                      ││
│  │ Required                        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Learning Domain (Select)        ││
│  │ v Direito Constitucional        ││
│  │ > Direito Penal                 ││
│  │ > Direito Civil                 ││
│  │ > Direito Administrativo        ││
│  │ > Direito Tributário            ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [Get Started Button - Primary] ││
│  │  (disabled until name + domain) ││
│  └─────────────────────────────────┘│
│                                     │
│  > Skip for now                     │
└─────────────────────────────────────┘
```

### Components Used

| Component | Type | Count | Purpose |
|-----------|------|-------|---------|
| **FormField** | Molecule | 2 | Full name, domain |
| **Input** | Atom | 1 | Full name text input |
| **DomainSelector** | Molecule | 1 | Select learning domain |
| **Button** | Atom | 1 | Upload avatar |
| **Button** | Atom | 1 | Get Started (primary) |
| **Link** | Atom | 1 | Skip for now |
| **Text** | Atom | 5+ | Headings, hints |
| **Avatar** | Atom | 1 | Profile picture |

### State Management

```typescript
interface CompleteProfileState {
  avatar: File | null;
  avatarPreview: string;  // DataURL
  fullName: string;
  domain: string;  // UUID from domains table
  loading: boolean;
  uploadingAvatar: boolean;
  errors: {
    fullName?: string;
    domain?: string;
    avatar?: string;
  };
}
```

### Form Validation

1. **Avatar** (Optional)
   - ✅ Image file (JPG, PNG)
   - ✅ Max 5MB
   - Error: "File too large" or "Invalid image format"

2. **Full Name**
   - ✅ Not empty
   - ✅ 2-100 characters
   - Error: "Name is required" or "Name too long"

3. **Domain**
   - ✅ Must select one
   - Error: "Select a domain"

### API Interaction

```typescript
// Upload avatar (multipart)
// POST /api/users/{id}/avatar
{
  avatar: File
}

// Update profile
// PUT /api/users/{id}/profile
{
  fullName: "João Silva",
  domainId: "uuid-of-domain"
}

// Response 200 OK
{
  success: true,
  message: "Profile completed",
  redirectTo: "/dashboard"
}
```

### User Actions

- ✅ Click avatar to upload image
- ✅ Type full name
- ✅ Click domain select and choose one
- ✅ Click "Get Started" to complete signup
- ✅ Click "Skip for now" to go to dashboard
- ✅ Drag & drop avatar image

---

## 🎭 User States & Transitions

### Happy Path

```
Start
  ↓
Email validation + sign up
  ↓
Check email, enter code or click link
  ↓
Email verified
  ↓
Upload avatar, enter name, select domain
  ↓
Profile complete → Dashboard (logged in)
```

### Error Scenarios

#### Email Already Registered
```
Signup Form
  ↓ Enter existing email
  ↓ Click Sign Up
Error: "Email already registered"
  ↓
User clicks "Sign In" link
  → Redirected to login page
```

#### Invalid Code
```
Email Verification
  ↓ Enter wrong code
  ↓ Click Verify
Error: "Invalid code"
  ↓
User can resend after countdown
```

#### Code Expired
```
Email Verification
  ↓ Wait >15 minutes
  ↓ Click Verify
Error: "Code expired"
  ↓
Click "Resend Code"
```

#### Weak Password
```
Signup Form
  ↓ Enter weak password (e.g., "123456")
  ↓ Click Sign Up
Error: "Password too weak - must have uppercase letter"
  ↓
User must fix password and try again
```

---

## ⏱️ Timeline & Milestones

| Milestone | Week | Task |
|-----------|------|------|
| **Design Review** | Week 1 | Finalize screens, components |
| **Component Build** | Week 1-2 | Build atoms & molecules |
| **Page Implementation** | Week 2 | Integrate with Supabase Auth |
| **Testing** | Week 2 | Unit tests, E2E tests |
| **Launch** | Week 3 | Live on production |

---

## 🧪 Testing Checklist

- [ ] Valid email signup works
- [ ] Email validation catches invalid emails
- [ ] Duplicate email error shows
- [ ] Password validation rules enforced
- [ ] Passwords don't match error shows
- [ ] Terms checkbox required
- [ ] Verification code input works (6 digits)
- [ ] Resend code countdown works
- [ ] Email link auto-verifies
- [ ] Profile name required
- [ ] Domain selection required
- [ ] Avatar upload works (JPG, PNG, <5MB)
- [ ] Skip profile works
- [ ] Successful signup redirects to dashboard
- [ ] All error messages clear and helpful

---

## 🔒 Security Considerations

1. **Password Strength**
   - Enforced on frontend AND backend
   - Minimum 8 characters, 1 uppercase, 1 number
   - Never send plaintext passwords (use HTTPS)

2. **Email Verification**
   - Token expires after 15 minutes
   - Email links one-time use
   - Resend throttled (max 3 per 5 minutes)

3. **Avatar Upload**
   - File type validation (image/* only)
   - Max 5MB size limit
   - Scan for malware (server-side)
   - Stored in secure cloud storage

4. **Rate Limiting**
   - Max 5 signup attempts per IP/hour
   - Max 10 resend code attempts per user/hour
   - Max 3 failed verifications per code

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Development

