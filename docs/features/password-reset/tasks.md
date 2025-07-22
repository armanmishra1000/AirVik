# Password Reset Tasks

## Backend Tasks (Complete these first)
Each task should be completable and testable with Postman independently.

### Task B1: Create MongoDB Schema & Models (3 hours)
**What this does**: Defines how password reset data is stored in database
**Details**: 
- Update `backend/src/models/user.model.ts` to add password reset fields
- Create `backend/src/models/password-reset-log.model.ts` for audit logging
- Add indexes for performance on reset tokens and expiration times
- Add validation at schema level for token format and expiration
- Add TTL index for automatic cleanup of expired tokens
**Test**: Can create user with reset fields and password reset log documents directly in MongoDB

### Task B2: Create Password Reset Utilities (2 hours)
**What this does**: Utilities for token generation, hashing, and validation
**Details**:
- Create `backend/src/utils/password-reset.util.ts`
- Implement secure token generation using crypto.randomBytes()
- Add token hashing and verification functions
- Create password policy validation functions
- Add email template helper functions
**Test**: Can generate tokens, hash them, and verify them in Node console

### Task B3: Create Email Service for Password Reset (2.5 hours)
**What this does**: Email templates and sending logic for reset emails
**Details**:
- Update `backend/src/services/email.service.ts` with reset templates
- Create HTML and text email templates for password reset request
- Create confirmation email template for successful reset
- Add security notification email template
- Implement rate limiting for email sending
**Test**: Can send test emails with all templates to real email address

### Task B4: Create Password Reset Service Layer (4 hours)
**What this does**: Business logic for all password reset operations
**Details**:
- Create `backend/src/services/password-reset.service.ts`
- Implement `requestPasswordReset()` with rate limiting and validation
- Implement `verifyResetToken()` with expiration checking
- Implement `confirmPasswordReset()` with password policy enforcement
- Add comprehensive audit logging for all operations
- Handle token cleanup and security measures
**Test**: Can call all service functions with various scenarios in Node console

### Task B5: Create Password Reset Controllers (3 hours)
**What this does**: HTTP endpoints for password reset operations
**Details**:
- Create `backend/src/controllers/password-reset.controller.ts`
- Implement request, verify, confirm, and status endpoints
- Add input validation middleware
- Add rate limiting middleware specific to password reset
- Follow exact API spec from api.md with proper error handling
**Test**: Controllers return proper responses for all success and error cases

### Task B6: Create Password Reset Routes (1.5 hours)
**What this does**: Route configuration for password reset endpoints
**Details**:
- Create `backend/src/routes/password-reset.routes.ts`
- Configure all four endpoints with proper middleware
- Add authentication requirements for admin status endpoint
- Include rate limiting and CSRF protection
- Integrate with main app routes
**Test**: Can access all routes and get expected middleware behavior

### Task B7: Create Rate Limiting Middleware (2 hours)
**What this does**: Prevent abuse of password reset functionality
**Details**:
- Create `backend/src/middleware/password-reset-limiter.middleware.ts`
- Implement per-email, per-IP, and global rate limiting
- Add configurable limits for different endpoints
- Include proper error responses with retry-after headers
- Add logging for rate limit violations
**Test**: Rate limits trigger correctly and reset after time periods

### Task B8: Create Postman Collection (1 hour)
**What this does**: Testing suite for all password reset endpoints
**Details**:
- Create `postman/password-reset.postman_collection.json`
- Add requests for all four endpoints with example data
- Include environment variables for testing
- Add tests to verify response format and status codes
- Include negative test cases (expired tokens, invalid emails, etc.)
**Test**: Run entire collection successfully with all tests passing

## Frontend Tasks (Can start in parallel)
Each task should show visible results in browser.

### Task F1: Create TypeScript Types (1.5 hours)
**What this does**: Type safety for password reset data structures
**Details**:
- Create `frontend/src/types/password-reset.types.ts`
- Define interfaces for all API request/response types
- Export types for password policies and validation
- Match backend schema and API responses exactly
- Include error response types
**Test**: No TypeScript errors in project, IntelliSense working

### Task F2: Create Password Reset API Service (2.5 hours)
**What this does**: Functions to call backend password reset APIs
**Details**:
- Create `frontend/src/services/password-reset.service.ts`
- Implement functions for request, verify, confirm operations
- Add proper error handling and timeout configuration
- Use correct types from Task F1
- Include retry logic for network failures
**Test**: Can import service and see IntelliSense working, functions have correct signatures

### Task F3: Create Password Reset Request Form (3 hours)
**What this does**: Form where users enter email to request password reset
**Details**:
- Create `frontend/src/components/password-reset/PasswordResetRequest.tsx`
- Email input with real-time validation
- Submit button with loading state and rate limiting feedback
- Success message display after successful request
- Error handling with user-friendly messages
- Responsive design with Tailwind CSS
**Test**: Navigate to page, submit valid/invalid emails, see appropriate responses

### Task F4: Create Password Reset Form (4 hours)
**What this does**: Form where users set new password using reset token
**Details**:
- Create `frontend/src/components/password-reset/PasswordResetForm.tsx`
- New password input with strength indicator
- Confirm password input with real-time matching validation
- Password policy requirements display
- Token validation on component mount
- Loading states and error handling
- Auto-redirect after successful reset
**Test**: Access form with valid/invalid tokens, test password validation, complete reset flow

### Task F5: Create Password Strength Indicator (2 hours)
**What this does**: Visual feedback for password strength and policy compliance
**Details**:
- Create `frontend/src/components/password-reset/PasswordStrengthIndicator.tsx`
- Visual strength meter (weak/medium/strong)
- Checklist of password policy requirements
- Real-time updates as user types
- Color-coded feedback with icons
- Responsive design
**Test**: Type various passwords and see strength indicator update correctly

### Task F6: Create Email Template Preview (2 hours)
**What this does**: Preview password reset emails in browser for testing
**Details**:
- Create `frontend/src/components/password-reset/EmailPreview.tsx`
- Render HTML email templates
- Include test data for previewing
- Add admin-only route for email testing
- Style with Tailwind to match email appearance
**Test**: Admin can view email templates in browser before sending

### Task F7: Create Success/Error Pages (2.5 hours)
**What this does**: User feedback pages for various password reset scenarios
**Details**:
- Create `frontend/src/components/password-reset/PasswordResetSuccess.tsx`
- Create `frontend/src/components/password-reset/PasswordResetError.tsx`
- Success page with login link and confirmation message
- Error page for expired/invalid tokens with request new reset option
- Account locked notification page
- Consistent styling and user experience
**Test**: Navigate to success/error pages and verify correct messaging and links

### Task F8: Add Routes and Navigation (1.5 hours)
**What this does**: Access password reset pages from login and navigation
**Details**:
- Add routes to `frontend/src/app/` for all password reset pages
- Add "Forgot Password?" link on login page
- Configure proper layouts and meta tags
- Add breadcrumb navigation
- Update main navigation if needed
**Test**: Can navigate to all password reset pages from login page

### Task F9: Create Custom Hooks (2 hours)
**What this does**: Reusable hooks for password reset functionality
**Details**:
- Create `frontend/src/hooks/usePasswordReset.ts`
- Hook for managing password reset request state
- Hook for token verification and validation
- Hook for password strength calculation
- Include loading, error, and success states
**Test**: Import hooks in components and verify state management works correctly

## Integration Tasks (After both complete)
Backend developer pulls frontend code and connects everything.

### Task I1: Connect Password Reset Request to Real API (2 hours)
**What this does**: Replace mock data with real API calls for reset requests
**Prerequisites**: Backend dev has pulled latest frontend code
**Details**:
- Update `frontend/src/services/password-reset.service.ts`
- Point request function to actual backend URL
- Ensure proper error handling for all API response codes
- Test rate limiting integration
- Verify email sending works end-to-end
**Test**: Submit reset requests and receive actual emails

### Task I2: Connect Token Verification to Real API (1.5 hours)
**What this does**: Validate tokens against real backend
**Details**:
- Connect token verification to backend API
- Handle all possible token states (valid, expired, used, invalid)
- Show appropriate error messages for each case
- Add token expiration countdown timer
**Test**: Test with valid, expired, and invalid tokens

### Task I3: Connect Password Reset Form to Real API (2.5 hours)
**What this does**: Complete password reset flow with database updates
**Details**:
- Connect form submission to confirm API endpoint
- Handle password policy validation from backend
- Manage authentication tokens after successful reset
- Clear form and redirect after success
- Handle all error scenarios gracefully
**Test**: Complete full password reset flow and verify new password works

### Task I4: Connect Email Service Integration (2 hours)
**What this does**: Verify email sending and template rendering
**Details**:
- Test all email templates with real data
- Verify email delivery and formatting
- Test email security features (no XSS, proper encoding)
- Verify email links work correctly
- Test email delivery timing and reliability
**Test**: Receive and verify all types of password reset emails

### Task I5: Implement Security Features (2.5 hours)
**What this does**: Add production security measures
**Details**:
- Implement CSRF protection on all forms
- Add HTTPS-only enforcement
- Enable security headers middleware
- Add IP address logging and tracking
- Implement proper session invalidation
**Test**: Verify security headers and CSRF protection work

### Task I6: Create Admin Monitoring Dashboard (3 hours)
**What this does**: Admin interface to monitor password reset activity
**Details**:
- Create admin page showing password reset statistics
- Display recent reset attempts and success rates
- Add filtering by email, IP, date range
- Show rate limiting status and blocked attempts
- Add export functionality for audit logs
**Test**: Admin can view and filter password reset activity

### Task I7: End-to-End Testing (3 hours)
**What this does**: Comprehensive testing of complete password reset flow
**Details**:
- Test complete happy path: request → email → reset → login
- Test edge cases: expired tokens, invalid emails, rate limits
- Test security scenarios: CSRF attacks, brute force attempts
- Test email delivery and template rendering
- Test mobile responsive design
- Verify all error messages are user-friendly
**Test**: All password reset scenarios work smoothly across devices

### Task I8: Performance Optimization (2 hours)
**What this does**: Optimize password reset performance and reliability
**Details**:
- Add database query optimization for reset tokens
- Implement token cleanup job for expired tokens
- Add caching for rate limiting counters
- Optimize email template rendering
- Add monitoring and alerting for failures
**Test**: Reset operations complete within SLA timeframes

### Task I9: Final Documentation Update (1 hour)
**What this does**: Complete feature documentation and deployment guide
**Details**:
- Update `docs/features/password-reset/progress.md`
- Document any implementation decisions or changes
- Create deployment checklist
- Update main feature index
- Mark feature COMPLETE
**Test**: Documentation is complete and accurate
