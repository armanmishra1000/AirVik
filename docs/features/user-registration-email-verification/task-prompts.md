# Task Prompt Templates for User Registration with Email Verification

## Backend Task B1: MongoDB Schema
Copy this prompt:
```
Create the MongoDB schema for user registration with email verification based on:
- Requirements in docs/features/user-registration-email-verification/spec.md
- VikBooking reference shows these fields: email, password, firstName, lastName from UsersModelRegistration

Create file: backend/src/models/user.model.ts

Include:
1. All fields from spec with correct types: email (string, unique), password (string, hashed), firstName (string), lastName (string), phoneNumber (string, optional), status (enum: 'unverified'|'verified'|'suspended'), emailVerificationToken (string, optional), emailVerificationTokenExpires (Date, optional)
2. Timestamps (createdAt, updatedAt) - automatic
3. Indexes on: email (unique), emailVerificationToken (sparse), createdAt (-1), status+createdAt compound
4. Validation rules: email format, password min 8 chars, firstName/lastName 2-50 chars
5. Virtual fields for: fullName (firstName + lastName)
6. Pre-save hooks for: password hashing with bcrypt, updating updatedAt timestamp

Use Mongoose with TypeScript. Follow our MongoDB schema patterns from .windsurfrules.
```

## Backend Task B2: Service Layer
Copy this prompt:
```
Create the service layer for user registration with email verification that implements business logic.

Create file: backend/src/services/auth.service.ts

Based on VikBooking analysis, implement these operations:
- User registration (similar to UsersModelRegistration::register)
- Email verification token generation and validation
- Rate limiting for registration attempts
- Password hashing and validation

Include these methods:
1. registerUser(userData) - with validation: email uniqueness, password strength, required fields
2. generateVerificationToken() - with crypto.randomBytes for security
3. verifyEmailToken(token) - with token validation, expiration check, single-use enforcement
4. resendVerificationEmail(email) - check permissions: rate limiting (3 per hour), user exists and unverified
5. hashPassword(password) - bcrypt hashing with salt rounds

Business rules to implement:
- Email must be unique across all users
- Passwords must meet security requirements (8+ chars, uppercase, lowercase, number)
- Verification tokens expire after 24 hours
- Rate limiting: 3 registration attempts per IP per hour, 3 verification emails per email per hour
- New accounts start with 'unverified' status

Follow service pattern from .windsurfrules. Handle all errors properly with custom error classes.
```

## Backend Task B3: API Endpoints
Copy this prompt:
```
Create the API endpoints for user registration with email verification.

Create files:
- backend/src/controllers/auth.controller.ts
- backend/src/routes/auth.routes.ts

Follow exact API spec from docs/features/user-registration-email-verification/api.md:

Implement these endpoints:
1. POST /api/v1/auth/register - Register new user
2. POST /api/v1/auth/verify-email - Verify email with token
3. GET /api/v1/auth/verify-email/:token - Browser redirect verification
4. POST /api/v1/auth/resend-verification - Resend verification email

Include:
- Request validation using express-validator
- Rate limiting middleware (express-rate-limit)
- Proper error handling with standardized error responses
- Input sanitization for security
- Logging for debugging and monitoring
- CORS headers for frontend integration

Authentication: These endpoints are public (no auth required)
Follow controller and routing patterns from .windsurfrules.
```

## Backend Task B4: Email Service
Copy this prompt:
```
Create the email service for sending verification and notification emails.

Create files:
- backend/src/services/email.service.ts
- backend/src/templates/welcome-verification.html
- backend/src/templates/verification-success.html

Implement email service with:
1. sendVerificationEmail(user, token) - Send welcome email with verification link
2. sendVerificationSuccessEmail(user) - Send confirmation after successful verification
3. Email template rendering with user data substitution
4. Support for HTML and text email formats

Email service features:
- Configure for SendGrid, AWS SES, or SMTP
- Retry logic for failed email sends
- Error handling and logging
- Rate limiting integration
- Template variable substitution
- Professional hotel branding in templates

Templates should include:
- Clear verification call-to-action button
- Backup verification link as text
- Token expiration information (24 hours)
- Contact information for support
- Responsive design for all email clients

Follow email service patterns from .windsurfrules. Handle email provider errors gracefully.
```

## Backend Task B5: Postman Collection
Copy this prompt:
```
Create comprehensive Postman collection for testing user registration with email verification APIs.

Create file: postman/user-registration-email-verification.postman_collection.json

Include requests for:
1. POST /api/v1/auth/register - Multiple test cases (valid, invalid email, weak password, duplicate email)
2. POST /api/v1/auth/verify-email - Test with valid token, expired token, invalid token
3. GET /api/v1/auth/verify-email/:token - Browser redirect testing
4. POST /api/v1/auth/resend-verification - Valid email, non-existent email, already verified

For each request include:
- Example request data with realistic test values
- Tests to verify response status codes
- Tests to verify response structure matches API spec
- Tests to verify business logic (e.g., user created, status changed)
- Environment variables for base URL, test email, tokens
- Pre-request scripts for data setup
- Negative test cases for error handling

Add collection-level tests for:
- Rate limiting behavior
- Email uniqueness validation
- Token expiration handling
- Complete registration flow

Make collection runnable with Newman for CI/CD integration.
```

## Backend Task B6: Documentation Update
Copy this prompt:
```
Update progress documentation for completed backend tasks.

Update file: docs/features/user-registration-email-verification/progress.md

Mark these tasks as complete:
- [x] B1: MongoDB Schema (2 hours)
- [x] B2: Service Layer (3 hours)  
- [x] B3: API Endpoints (3 hours)
- [x] B4: Email Service (2 hours)
- [x] B5: Postman Collection (1 hour)
- [x] B6: Documentation Update (30 min)

Document:
- Any technical decisions made during implementation
- Deviations from original specification
- Environment variables needed for deployment
- Database setup requirements
- Email service configuration requirements

Add notes about:
- API endpoints ready for frontend integration
- Postman collection location and how to run it
- Any known issues or limitations discovered
- Performance considerations for production

Update overall status to: Backend: 6/6 tasks complete
```

## Frontend Task F1: TypeScript Types
Copy this prompt:
```
Create TypeScript types for user registration with email verification.

Create file: frontend/src/types/auth.types.ts

Based on backend schema and API spec, create these interfaces:

1. User interface matching MongoDB schema exactly
2. RegisterRequest interface for registration form data
3. VerifyEmailRequest interface for email verification
4. ResendVerificationRequest interface
5. ApiResponse<T> generic interface for all API responses
6. AuthError interface for error handling
7. Form validation interfaces for client-side validation

Include utility types for:
- Form states (loading, success, error)
- User status enum ('unverified' | 'verified' | 'suspended')
- Validation error types
- API error response types

Export all interfaces for use across components.
Ensure type safety matches backend exactly to prevent integration issues.
Follow TypeScript best practices from .windsurfrules.
```

## Frontend Task F2: API Service
Copy this prompt:
```
Create API service functions for calling user registration backend APIs.

Create file: frontend/src/services/auth.service.ts

Implement functions for each API endpoint from docs/features/user-registration-email-verification/api.md:

1. registerUser(userData: RegisterRequest): Promise<ApiResponse<User>>
2. verifyEmail(token: string): Promise<ApiResponse<User>>
3. resendVerificationEmail(email: string): Promise<ApiResponse<void>>
4. getUserProfile(): Promise<ApiResponse<User>> (for authenticated users)

Features to include:
- Proper TypeScript typing using interfaces from F1
- Error handling with typed error responses
- Request/response interceptors for common headers
- Loading state management
- Retry logic for network failures
- Environment-based URL configuration
- Authentication token handling for protected endpoints

Handle all error scenarios:
- Network errors
- Validation errors from backend
- Rate limiting responses
- Server errors

Use axios or fetch with proper error boundaries.
Follow API service patterns from .windsurfrules.
```

## Frontend Task F3: Registration Form Component
Copy this prompt:
```
Create user registration form component with validation.

Create file: frontend/src/components/auth/RegistrationForm.tsx

Implement registration form with all fields from spec:
- email (required, email validation)
- password (required, strength validation)  
- confirmPassword (required, must match password)
- firstName (required, 2-50 chars)
- lastName (required, 2-50 chars)
- phoneNumber (optional, format validation)

Features to include:
1. Real-time validation with error display
2. Password strength indicator
3. Form submission with loading states
4. Success handling (redirect to verification page)
5. Error handling for API validation errors
6. Rate limiting error display
7. Responsive design for mobile and desktop
8. Accessibility features (ARIA labels, keyboard navigation)

Use React Hook Form or similar for form management.
Integrate with auth.service.ts for API calls.
Follow component patterns from .windsurfrules.
Style with Tailwind CSS or styled-components.
```

## Frontend Task F4: Email Verification Components
Copy this prompt:
```
Create email verification flow components.

Create files:
- frontend/src/components/auth/VerificationSuccess.tsx
- frontend/src/components/auth/VerificationResult.tsx
- frontend/src/components/auth/ResendVerification.tsx

VerificationSuccess component:
- Display after successful registration
- Clear instructions about checking email
- Resend verification email option
- Professional messaging with next steps
- Timer showing when user can request new email

VerificationResult component:
- Handle /auth/verify/:token route
- Show success/error based on token verification
- Auto-redirect after successful verification
- Error handling for expired/invalid tokens
- Link back to login page

ResendVerification component:
- Form to request new verification email
- Rate limiting display (show remaining time)
- Success/error message handling
- Integration with resend API

All components should be responsive and accessible.
Follow component patterns from .windsurfrules.
```

## Frontend Task F5: User Profile Components
Copy this prompt:
```
Create user profile display and edit components.

Create files:
- frontend/src/components/user/UserProfile.tsx
- frontend/src/components/user/EditProfile.tsx

UserProfile component:
- Display user information: name, email, phone, status
- Show verification status with appropriate badges
- Verification prompt for unverified users
- Edit profile button
- Professional layout with user avatar placeholder

EditProfile component:
- Form to update firstName, lastName, phoneNumber
- Cannot change email (display only)
- Form validation matching registration requirements
- Success/error handling for updates
- Cancel and save buttons
- Loading states during API calls

Features:
- Responsive design matching site theme
- Integration with auth.service.ts
- Proper TypeScript typing
- Accessibility compliance
- Error boundary for graceful failures

Follow component patterns from .windsurfrules.
```

## Frontend Task F6: Routes and Navigation
Copy this prompt:
```
Add routes and navigation for user registration with email verification.

Update files:
- pages/ directory (Next.js) or routing configuration
- Navigation components for menu items

Add these routes:
1. /register - Registration form page
2. /register/success - Post-registration success page
3. /auth/verify/[token] - Email verification handler
4. /auth/verify-success - Verification success page
5. /auth/verify-error - Verification error page
6. /profile - User profile page (authenticated only)

Navigation updates:
- Add "Sign Up" link to main navigation (when not logged in)
- Add user profile link to user menu (when logged in)
- Add appropriate page titles and metadata
- Implement route guards for authenticated routes

Include:
- Proper page layouts and breadcrumbs
- Loading states for route transitions
- Error boundaries for route errors
- SEO optimization for public pages

Follow routing patterns from .windsurfrules.
```

## Frontend Task F7: Form Validation Utilities
Copy this prompt:
```
Create reusable form validation utilities.

Create file: frontend/src/utils/validation.ts

Implement validation functions:
1. validateEmail(email: string): ValidationResult
2. validatePassword(password: string): PasswordValidation
3. validatePhoneNumber(phone: string): ValidationResult
4. validateName(name: string): ValidationResult
5. validateRequired(value: any): ValidationResult

PasswordValidation should include:
- Overall strength score
- Specific requirements met/missing
- Strength indicator level (weak/medium/strong)
- User-friendly error messages

ValidationResult interface:
- isValid: boolean
- message: string
- errors?: string[]

Additional utilities:
- Form field validation helpers
- Error message standardization
- Async validation debouncing
- Password strength scoring algorithm

Export all validation functions and types.
Include comprehensive test cases for each validator.
Follow utility patterns from .windsurfrules.
```

## Frontend Task F8: Documentation Update
Copy this prompt:
```
Update progress documentation for completed frontend tasks.

Update file: docs/features/user-registration-email-verification/progress.md

Mark these tasks as complete:
- [x] F1: TypeScript Types (1 hour)
- [x] F2: API Service (2 hours)
- [x] F3: Registration Form Component (4 hours)
- [x] F4: Email Verification Components (3 hours)
- [x] F5: User Profile Components (2 hours)
- [x] F6: Routes & Navigation (1 hour)
- [x] F7: Form Validation Utilities (1 hour)
- [x] F8: Documentation Update (30 min)

Document:
- Component file locations and purposes
- Any UI/UX decisions made during implementation
- Dependencies added (libraries, packages)
- Styling approach used
- Accessibility features implemented

Add notes about:
- Components ready for API integration
- Mock data used during development
- Responsive design breakpoints
- Browser compatibility tested
- Known issues or limitations

Update overall status to: Frontend: 8/8 tasks complete
```


## Integration Task I1: Connect API Service to Real Backend
Copy this prompt:
```
Connect frontend API service to real backend endpoints.

Prerequisites: Backend developer has pulled latest frontend code and backend is running

Update file: frontend/src/services/auth.service.ts

Changes needed:
- Update API base URLs to point to running backend (development environment)
- Ensure all endpoints match backend implementation exactly
- Add authentication token handling for protected routes
- Implement proper error handling for all backend error responses
- Add request interceptors for common headers (Content-Type, Authorization)
- Handle network timeouts and connection errors
- Update environment variables for different deployment environments

Test connectivity:
- Verify all API calls work in browser network tab
- Test error scenarios return proper typed errors
- Confirm rate limiting displays appropriate messages
- Validate response data matches TypeScript interfaces

Integration checklist:
- [ ] Registration endpoint connected and working
- [ ] Email verification endpoint connected  
- [ ] Resend verification endpoint connected
- [ ] Profile endpoints connected (if implemented)
- [ ] Error handling works for all scenarios
- [ ] Loading states display properly
```

## Integration Task I2: Connect Registration Form to API
Copy this prompt:
```
Connect registration form component to real backend API.

Prerequisites: I1 (API Service connected) is complete

Update file: frontend/src/components/auth/RegistrationForm.tsx

Connect form submission:
- Use connected auth.service.ts for registration API calls
- Replace any mock data with real API integration
- Implement proper loading states during form submission
- Handle success response (redirect to verification success page)
- Display backend validation errors in form fields
- Handle rate limiting errors with appropriate user messaging
- Add form reset after successful submission

Error handling:
- Map backend field errors to form field display
- Show general API errors above form
- Handle network errors gracefully
- Display rate limiting countdown if applicable

Success flow:
- Clear form data after successful submission
- Redirect to /register/success page
- Pass user data to success page if needed

Test registration flow:
- [ ] Valid registration data submits successfully
- [ ] Form validation prevents invalid submissions
- [ ] Backend validation errors display properly
- [ ] Rate limiting handled gracefully
- [ ] Success redirect works correctly
```

## Integration Task I3: Connect Email Verification Flow
Copy this prompt:
```
Connect email verification components to real backend APIs.

Prerequisites: I1 (API Service connected) is complete

Update files:
- frontend/src/components/auth/VerificationResult.tsx
- frontend/src/components/auth/ResendVerification.tsx

VerificationResult component:
- Connect to verify-email API endpoint
- Extract token from URL parameters
- Call verification API on component mount
- Handle success: show success message, auto-redirect to login
- Handle errors: expired token, invalid token, already verified
- Display appropriate error messages with next steps

ResendVerification component:
- Connect to resend-verification API endpoint
- Handle rate limiting (show countdown timer)
- Display success message when email sent
- Handle errors: user not found, already verified
- Reset form after successful resend

Test verification flow:
- [ ] Valid tokens verify successfully
- [ ] Expired tokens show appropriate error
- [ ] Invalid tokens handled gracefully
- [ ] Resend functionality works with rate limiting
- [ ] Success states redirect properly
```

## Integration Task I4: Connect User Profile to API
Copy this prompt:
```
Connect user profile components to real backend APIs.

Prerequisites: I1 (API Service connected) is complete

Update files:
- frontend/src/components/user/UserProfile.tsx
- frontend/src/components/user/EditProfile.tsx

UserProfile component:
- Load real user data from GET /users/profile API
- Display actual verification status
- Show verification prompt for unverified users
- Handle loading states while fetching data
- Handle errors if profile cannot be loaded

EditProfile component:
- Load current user data for form population
- Connect form submission to PUT /users/profile API
- Handle success: update displayed data, show success message
- Handle validation errors from backend
- Handle network errors gracefully

Authentication integration:
- Ensure API calls include proper authentication tokens
- Handle token expiration (redirect to login)
- Update authentication state after profile changes

Test profile functionality:
- [ ] Profile data loads correctly
- [ ] Edit form populates with current data
- [ ] Profile updates save successfully
- [ ] Validation errors display properly
- [ ] Authentication errors handled
```

## Integration Task I5: Add Authentication Integration
Copy this prompt:
```
Integrate user registration with existing authentication system.

Prerequisites: All previous integration tasks complete

Integration points:
1. Ensure registration creates users compatible with existing login system
2. Handle JWT tokens for authenticated requests to registration APIs
3. Add authentication state management for registration status
4. Implement route guards for verified users only
5. Show verification prompts for unverified users trying to access protected features

Updates needed:
- Verify JWT token format matches existing authentication
- Update authentication context to include verification status
- Add route protection for booking features (verified users only)
- Display verification warnings on protected pages for unverified users
- Integrate with existing logout functionality

Testing authentication flow:
- [ ] Register → Verify → Login flow works completely
- [ ] Unverified users see appropriate restrictions
- [ ] Verified users have full access
- [ ] JWT tokens work with both old and new endpoints
- [ ] Logout clears all authentication state properly

Document any changes needed to existing authentication system.
```

## Integration Task I6: End-to-End Testing
Copy this prompt:
```
Perform comprehensive end-to-end testing of user registration with email verification.

Prerequisites: All integration tasks (I1-I5) complete

Test scenarios:
1. Complete happy path: Register → Receive email → Verify → Login → Profile
2. Registration validation: Test all field validations work
3. Email verification: Test token expiration, invalid tokens, already used tokens
4. Resend functionality: Test rate limiting, success messages
5. Profile management: Test view and edit functionality
6. Error scenarios: Network failures, server errors, validation failures
7. Mobile responsive: Test all flows on mobile devices
8. Cross-browser: Test on Chrome, Firefox, Safari, Edge

Performance testing:
- [ ] Registration form responds quickly
- [ ] API calls complete within reasonable time
- [ ] No memory leaks in single-page app navigation
- [ ] Email delivery timing (check spam folders)

Security testing:
- [ ] Password hashing works properly
- [ ] Verification tokens are secure and single-use
- [ ] Rate limiting prevents abuse
- [ ] XSS protection in all form inputs
- [ ] CSRF protection on API calls

Create test report documenting:
- All test cases and results
- Any bugs found and resolved
- Performance metrics
- Browser compatibility results
- Mobile responsiveness results
```

## Integration Task I7: Final Documentation Update
Copy this prompt:
```
Complete final documentation update for user registration with email verification feature.

Update file: docs/features/user-registration-email-verification/progress.md

Mark all tasks as complete:
- Backend: 6/6 tasks complete
- Frontend: 8/8 tasks complete  
- Integration: 7/7 tasks complete
- Overall Status: COMPLETE

Final documentation:
1. Update progress.md with completion status
2. Document final deployment requirements
3. Add troubleshooting guide for common issues
4. List all environment variables needed
5. Document email service configuration
6. Add monitoring and logging recommendations

Create deployment checklist:
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Email service tested in production
- [ ] Rate limiting configured
- [ ] Security headers implemented
- [ ] Error tracking setup
- [ ] Performance monitoring enabled

Add to main project documentation:
- Feature completion notice
- Link to full feature documentation
- Integration notes for other developers
- Maintenance and support information

The feature is now PRODUCTION READY!
```
