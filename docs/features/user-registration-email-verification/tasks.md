# User Registration with Email Verification Tasks

## Backend Tasks (Complete these first)
Each task should be completable and testable with Postman independently.

### Task B1: Create MongoDB Schema
**What this does**: Defines how user registration data is stored in database
**Details**: 
- Create `backend/src/models/user.model.ts`
- Include all fields from spec.md: email, password, firstName, lastName, phoneNumber, status, verification tokens
- Add indexes for performance: email (unique), emailVerificationToken (sparse), createdAt, status+createdAt compound
- Add validation at schema level: email format, password requirements, required fields
- Add pre-save hooks for password hashing and timestamps
- Include virtual fields for full name if needed
**Test**: Can create user document directly in MongoDB

### Task B2: Create Service Layer
**What this does**: Business logic for user registration and email verification operations
**Details**:
- Create `backend/src/services/auth.service.ts`
- Implement registerUser function with email uniqueness check
- Implement generateVerificationToken with crypto.randomBytes
- Implement verifyEmail function with token validation and expiration
- Implement resendVerificationEmail with rate limiting
- Add business rule validations: password strength, email format, rate limits
- Handle errors properly with custom error classes
- Include email service integration for sending verification emails
**Test**: Can call service functions in Node console

### Task B3: Create API Endpoints
**What this does**: HTTP endpoints for frontend to call
**Details**:
- Create `backend/src/controllers/auth.controller.ts`
- Create `backend/src/routes/auth.routes.ts`
- Follow exact API spec from api.md: POST /register, POST /verify-email, GET /verify-email/:token, POST /resend-verification
- Add authentication middleware for protected routes
- Implement proper request validation with express-validator
- Add rate limiting middleware for registration and resend endpoints
- Include comprehensive error handling and logging
**Test**: Use Postman collection to test each endpoint

### Task B4: Create Email Service
**What this does**: Service for sending verification and notification emails
**Details**:
- Create `backend/src/services/email.service.ts`
- Implement sendVerificationEmail function with HTML templates
- Create email templates in `backend/src/templates/`: welcome-verification.html, verification-success.html
- Configure email provider (SendGrid, AWS SES, or SMTP)
- Add email template rendering with user data
- Include error handling and retry logic for email failures
- Add email logging for debugging
**Test**: Can send test emails and verify delivery

### Task B5: Create Postman Collection
**What this does**: Testing suite for all endpoints
**Details**:
- Create `postman/user-registration-email-verification.postman_collection.json`
- Add request for each endpoint: register, verify-email, resend-verification, get user profile
- Include example data for all requests
- Add tests to verify response status, structure, and business logic
- Include environment variables for base URL and test data
- Add negative test cases for validation errors
**Test**: Run entire collection successfully

### Task B6: Update Progress Documentation
**What this does**: Track backend completion
**Details**:
- Update `docs/features/user-registration-email-verification/progress.md`
- Mark all backend tasks complete
- Document any decisions or changes made during implementation
- Note API endpoints ready for frontend integration
- List any deviations from original spec

## Frontend Tasks (Can start in parallel)
Each task should show visible results in browser.

### Task F1: Create TypeScript Types
**What this does**: Type safety for user registration data
**Details**:
- Create `frontend/src/types/auth.types.ts`
- Match backend schema exactly: User, RegisterRequest, VerifyEmailRequest, ApiResponse interfaces
- Export interfaces for all data structures used in registration flow
- Include validation error types and API response types
- Add utility types for form states and loading states
**Test**: No TypeScript errors in project

### Task F2: Create API Service
**What this does**: Functions to call backend APIs
**Details**:
- Create `frontend/src/services/auth.service.ts`
- One function per API endpoint: registerUser, verifyEmail, resendVerification
- Handle errors consistently with proper error typing
- Use correct types from Task F1
- Implement request/response interceptors for common headers
- Add loading states and error states management
- Include retry logic for network failures
**Test**: Can import and see IntelliSense working

### Task F3: Create Registration Form Component
**What this does**: User registration form with validation
**Details**:
- Create `frontend/src/components/auth/RegistrationForm.tsx`
- All fields from spec: email, password, confirmPassword, firstName, lastName, phoneNumber
- Client-side validation with real-time feedback
- Password strength indicator
- Error display for field validation and API errors
- Success feedback with next steps
- Responsive design for mobile and desktop
- Loading states during form submission
**Test**: Fill form and see validation working, submit shows loading state

### Task F4: Create Email Verification Components
**What this does**: Email verification flow and status pages
**Details**:
- Create `frontend/src/components/auth/VerificationSuccess.tsx` - Success page after registration
- Create `frontend/src/components/auth/VerificationResult.tsx` - Result page after clicking email link
- Create `frontend/src/components/auth/ResendVerification.tsx` - Component to resend verification email
- Include countdown timers for resend functionality
- Error handling for expired or invalid tokens
- Professional messaging and clear next steps
**Test**: Navigate to pages and see appropriate content

### Task F5: Create User Profile Components
**What this does**: Display and edit user profile information
**Details**:
- Create `frontend/src/components/user/UserProfile.tsx` - Display profile info
- Create `frontend/src/components/user/EditProfile.tsx` - Edit profile form
- Display user status (verified/unverified) with appropriate badges
- Show verification prompt for unverified users
- Responsive design matching site theme
**Test**: View profile and edit profile functionality works

### Task F6: Add Routes and Navigation
**What this does**: Access registration and verification pages
**Details**:
- Add routes to Next.js app: /register, /register/success, /auth/verify/:token, /auth/verify-success, /auth/verify-error
- Add menu items for registration (when not logged in)
- Setup proper layouts and page titles
- Add route guards for authenticated vs unauthenticated users
- Include breadcrumb navigation where appropriate
**Test**: Can navigate to all registration and verification pages

### Task F7: Create Form Validation Utilities
**What this does**: Reusable validation functions
**Details**:
- Create `frontend/src/utils/validation.ts`
- Email format validation
- Password strength validation
- Phone number format validation
- Form field validation helpers
- Error message standardization
**Test**: Validation functions work correctly with test cases

### Task F8: Update Progress Documentation
**What this does**: Track frontend completion
**Details**:
- Update `docs/features/user-registration-email-verification/progress.md`
- Mark all frontend tasks complete
- Note ready for integration
- List all component files created
- Document any UI/UX decisions made

## Integration Tasks (After both complete)
Backend developer pulls frontend code and connects everything.

### Task I1: Connect API Service to Real Backend
**What this does**: Replace mock data with real API calls
**Prerequisites**: Backend dev has pulled latest frontend code
**Details**:
- Update `frontend/src/services/auth.service.ts`
- Point to actual backend URLs (development environment)
- Ensure authentication tokens included in requests
- Handle all error cases from backend API
- Update environment variables for API endpoints
- Test error handling for network failures
**Test**: Network tab shows real API calls

### Task I2: Connect Registration Form to API
**What this does**: Save registration data to database
**Details**:
- Update `RegistrationForm.tsx` to use API service
- Implement form submission to registration endpoint
- Show loading during registration
- Handle success (redirect to verification success page)
- Display API validation errors in form
- Handle rate limiting errors appropriately
**Test**: Register new user and see success page

### Task I3: Connect Email Verification Flow
**What this does**: Complete email verification process
**Details**:
- Connect verification result page to verify-email API
- Handle token validation and user status updates
- Show appropriate success/error messages
- Implement auto-redirect after successful verification
- Connect resend verification functionality
- Handle expired token scenarios gracefully
**Test**: Complete email verification flow works

### Task I4: Connect User Profile to API
**What this does**: Display and update real user data
**Details**:
- Connect UserProfile component to GET /users/profile API
- Connect EditProfile component to PUT /users/profile API
- Show actual user data from database
- Handle profile updates with success/error feedback
- Display verification status correctly
**Test**: View and edit profile with real data

### Task I5: Add Authentication Integration
**What this does**: Integrate with existing authentication system
**Details**:
- Ensure registration works with existing login system
- Handle JWT tokens for authenticated requests
- Add authentication state management
- Implement protected routes for verified users only
- Show appropriate messages for unverified users trying to book
**Test**: Complete flow from registration to authenticated booking

### Task I6: End-to-End Testing
**What this does**: Verify complete feature works
**Details**:
- Test complete registration flow: form → email → verification → login → profile
- Test complete update flow for profile information
- Test resend verification email functionality
- Test error scenarios: invalid tokens, expired tokens, duplicate emails
- Test on mobile view for responsive design
- Test rate limiting behavior
**Test**: All operations work smoothly across devices

### Task I7: Final Documentation Update
**What this does**: Mark feature complete
**Details**:
- Update `docs/features/user-registration-email-verification/progress.md`
- Mark feature COMPLETE
- Document any issues found during integration
- Update main feature index
- Add deployment notes if needed

## Task Dependencies

**Backend Dependencies:**
- B1 → B2 (Service layer needs schema)
- B2 → B3 (Controllers need service layer)
- B2 → B4 (Email service integrates with auth service)
- B3 → B5 (Postman tests need endpoints)

**Frontend Dependencies:**
- F1 → F2 (API service needs types)
- F1 → F3, F4, F5 (Components need types)
- F7 → F3 (Registration form needs validation utils)
- F6 depends on F3, F4, F5 (Routes need components)

**Integration Dependencies:**
- I1 requires B3, F2 complete
- I2 requires B3, F3, I1 complete
- I3 requires B3, F4, I1 complete
- I4 requires B3, F5, I1 complete
- I5 requires all backend and frontend tasks
- I6 requires I1-I5 complete
