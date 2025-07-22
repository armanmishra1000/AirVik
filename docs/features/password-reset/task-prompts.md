# Task Prompt Templates for Password Reset

## Backend Task B1: MongoDB Schema & Models
Copy this prompt:
```
Create the MongoDB schema for password reset based on docs/features/password-reset/spec.md

Update file: backend/src/models/user.model.ts  
Create file: backend/src/models/password-reset-log.model.ts

For User model, add fields: passwordResetToken, passwordResetExpires, passwordResetRequestedAt, passwordResetIP, passwordResetAttempts, lastPasswordReset

For Password Reset Log model include: userId, email, action, ip, userAgent, tokenHash, errorMessage, requestedAt, completedAt

Add indexes on email/token fields and TTL index on expiration. Use Mongoose with TypeScript.
```

## Backend Task B2: Password Reset Utilities
Copy this prompt:
```
Create utilities for token management: backend/src/utils/password-reset.util.ts

Functions needed: generateResetToken(), hashResetToken(), verifyResetToken(), validatePasswordPolicy(), formatResetEmail(), calculateTokenExpiry()

Use crypto.randomBytes(32) for tokens, bcrypt for hashing. Tokens expire in 1 hour. Password policy: 8+ chars, uppercase, lowercase, number.
```

## Backend Task B3: Email Service Integration
Copy this prompt:
```
Update backend/src/services/email.service.ts for password reset emails.

Add methods: sendPasswordResetEmail(), sendPasswordResetConfirmation(), sendSecurityNotification()

Create HTML + text templates for reset request, success confirmation, security alerts. Use SendGrid API. Include rate limiting (3 emails/hour per address).
```

## Backend Task B4: Service Layer
Copy this prompt:
```
Create backend/src/services/password-reset.service.ts with business logic.

Methods: requestPasswordReset(), verifyResetToken(), confirmPasswordReset(), getResetStatus()

Implement rate limiting (3/hour per email), token expiration (1 hour), password policy, session invalidation, audit logging. Handle all error cases.
```

## Backend Task B5: Controllers
Copy this prompt:
```
Create backend/src/controllers/password-reset.controller.ts following docs/features/password-reset/api.md

Endpoints: requestPasswordReset, verifyResetToken, confirmPasswordReset, getResetStatus

Include input validation, proper HTTP status codes, consistent response format, authentication for admin endpoint.
```

## Backend Task B6: Routes
Copy this prompt:
```
Create backend/src/routes/password-reset.routes.ts

Configure routes: POST /request, GET /verify, POST /confirm, GET /status

Add middleware: validation, rate limiting, CSRF protection, auth (for admin), logging, security headers.
```

## Backend Task B7: Rate Limiting Middleware
Copy this prompt:
```
Create backend/src/middleware/password-reset-limiter.middleware.ts

Limiters: emailResetLimiter (3/hour per email), ipResetLimiter (10/hour per IP), tokenVerifyLimiter, confirmAttemptLimiter

Use Redis backend. Return 429 with Retry-After headers. Log violations.
```

## Backend Task B8: Postman Collection
Copy this prompt:
```
Create postman/password-reset.postman_collection.json

Include requests for all endpoints with test scenarios: happy path, error cases, rate limiting, security tests.

Add pre-request scripts, environment variables, response tests. Cover valid/invalid emails, expired tokens, weak passwords.
```

## Frontend Task F1: TypeScript Types
Copy this prompt:
```
Create frontend/src/types/password-reset.types.ts

Interfaces: PasswordResetRequest, PasswordResetResponse, PasswordResetToken, PasswordResetConfirm, PasswordPolicy, ResetAttempt, ApiError

Match backend API spec exactly. Include validation helper types.
```

## Frontend Task F2: API Service
Copy this prompt:
```
Create frontend/src/services/password-reset.service.ts

Functions: requestPasswordReset(), verifyResetToken(), confirmPasswordReset(), getResetStatus()

Include error handling, retry logic, timeout config, TypeScript types. Handle network failures, validation errors, rate limits.
```

## Frontend Task F3: Request Form Component
Copy this prompt:
```
Create frontend/src/components/password-reset/PasswordResetRequest.tsx

Email input with validation, submit with loading state, success/error messages, rate limit feedback, link to login.

Real-time validation, responsive Tailwind design, professional hotel styling.
```

## Frontend Task F4: Reset Form Component
Copy this prompt:
```
Create frontend/src/components/password-reset/PasswordResetForm.tsx

Password inputs with strength indicator, confirm password matching, policy display, token validation on mount, loading states.

Token expiration countdown, redirect after success, comprehensive validation.
```

## Frontend Task F5: Password Strength Indicator
Copy this prompt:
```
Create frontend/src/components/password-reset/PasswordStrengthIndicator.tsx

Visual strength meter, policy requirements checklist, real-time updates, color-coded feedback.

Calculate strength based on length, uppercase, lowercase, numbers, special chars. Export utilities for reuse.
```

## Frontend Task F6: Email Template Preview
Copy this prompt:
```
Create frontend/src/components/password-reset/EmailPreview.tsx

Render email templates in browser, template selection, test data, admin-only access, mobile/desktop preview toggle.

Preview all email types with test data. Include send test email functionality.
```

## Frontend Task F7: Success/Error Pages
Copy this prompt:
```
Create success and error components for password reset scenarios.

Files: PasswordResetSuccess.tsx, PasswordResetError.tsx

Success: confirmation message, login link, security recommendations
Error: handle expired/invalid tokens, account locked, rate limits with appropriate CTAs
```

## Frontend Task F8: Routes and Navigation
Copy this prompt:
```
Add Next.js routes for password reset pages.

Routes: /password-reset/request, /password-reset/reset, /password-reset/success, /password-reset/error

Add "Forgot Password?" link on login page, breadcrumb navigation, proper meta tags, responsive layouts.
```

## Frontend Task F9: Custom Hooks
Copy this prompt:
```
Create frontend/src/hooks/usePasswordReset.ts

Hooks: usePasswordResetRequest, usePasswordResetToken, usePasswordStrength, usePasswordResetForm

Manage state for request/token/strength/form with loading, error, success states. Include TypeScript types and cleanup.
```

## Integration Tasks
Copy these prompts for integration phase:

### I1: Connect Request API
```
Connect PasswordResetRequest component to real backend API. Handle all response codes from API spec. Test rate limiting and email delivery.
```

### I2: Connect Token Verification  
```
Connect token verification to backend. Handle valid/expired/invalid/used tokens. Add expiration countdown timer.
```

### I3: Connect Reset Form API
```
Connect password reset form to completion API. Handle password policy validation, token states, auto-login after reset.
```

### I4: Email Service Testing
```
Test email templates, delivery timing, security, responsiveness across email providers. Verify links and content.
```

### I5: Security Implementation
```
Add CSRF protection, HTTPS enforcement, security headers, IP logging, session invalidation. Test security measures.
```

### I6: Admin Dashboard
```
Create admin monitoring interface with statistics, filtering, export functionality, real-time updates.
```

### I7: End-to-End Testing
```
Test complete flow: happy path, error scenarios, security, mobile responsive, performance. Document issues.
```

### I8: Performance Optimization
```
Optimize database queries, implement caching, token cleanup jobs, monitoring. Achieve performance SLA targets.
```

### I9: Final Documentation
```
Update progress.md, create deployment checklist, document decisions, troubleshooting guide, mark feature complete.
```
