# Task Prompts for Authentication & Users

## IMPORTANT: Use Planning Mode for All Tasks
Enable Planning Mode in Windsurf before running these prompts for better execution tracking.

## Backend Task B1: Enhance MongoDB Schema
Copy this prompt:
```
PLANNING MODE TASK: Enhance MongoDB Schema for Authentication & Users

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review backend/src/models/user.model.ts for current schema
- Check backend/src/models/ directory for existing models

Requirements from docs/features/authentication-users/spec.md:
- Update user model with all authentication fields (role, isEmailVerified, isActive, loginAttempts, lockoutUntil, etc.)
- Create email-verification-token.model.ts with token management
- Create refresh-token.model.ts for JWT refresh tokens
- Add proper MongoDB indexes for performance
- Add mongoose validation and password hashing middleware

FILE OPERATIONS:
- MODIFY: backend/src/models/user.model.ts (enhance with auth fields)
- CREATE: backend/src/models/email-verification-token.model.ts
- CREATE: backend/src/models/refresh-token.model.ts

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Update user.model.ts with complete schema from spec.md
2. Add password hashing pre-save middleware
3. Create email verification token model with expiration
4. Create refresh token model with revocation support
5. Add proper indexes for email, tokens, and expiration dates
6. Test schemas can be imported without errors
7. Run: git add backend/src/models/
8. Run: git commit -m "feat(auth): enhance user schema and add token models"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B1: Enhance MongoDB Schema - Updated user model and created token models with validation"
    - Add to Files Created: "backend/src/models/email-verification-token.model.ts: Email verification token schema"
    - Add to Files Created: "backend/src/models/refresh-token.model.ts: JWT refresh token schema"
    - Add to Files Modified: "backend/src/models/user.model.ts: Enhanced with complete auth fields and password hashing"

Follow MongoDB schema patterns from project-context memory and use TypeScript with Mongoose ODM.
```

## Backend Task B2: Complete Service Layer
Copy this prompt:
```
PLANNING MODE TASK: Complete Authentication Service Layer

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review backend/src/services/auth.service.ts for current implementation
- Check Task B1 completion and new model files

Requirements from docs/features/authentication-users/spec.md:
- Complete all authentication business logic methods
- Add JWT token generation and validation
- Add password hashing/validation logic
- Add email verification token handling
- Add password reset token handling
- Add rate limiting and account lockout logic
- Handle all error scenarios with proper error types

FILE OPERATIONS:
- MODIFY: backend/src/services/auth.service.ts (complete all methods)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Implement user registration with email verification
2. Implement login with rate limiting and lockout
3. Implement JWT token generation and refresh
4. Implement password reset flow
5. Add email verification methods
6. Add user profile management methods
7. Add comprehensive error handling
8. Test service methods can be called from Node console
9. Run: git add backend/src/services/auth.service.ts
10. Run: git commit -m "feat(auth): complete authentication service layer"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B2: Complete Service Layer - Implemented all auth business logic with security features"
    - Add to Files Modified: "backend/src/services/auth.service.ts: Complete authentication business logic implementation"

Follow service layer patterns from project-context memory and implement all business rules from spec.md.
```

## Backend Task B3: Create JWT Middleware
Copy this prompt:
```
PLANNING MODE TASK: Create JWT and Permission Middleware

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Check if backend/src/middleware/ directory exists
- Review completed auth service for JWT methods

Requirements from docs/features/authentication-users/spec.md:
- Create JWT token validation middleware
- Create role-based permission checking middleware
- Add request rate limiting middleware
- Handle token expiration and refresh logic
- Inject user authentication status into requests

FILE OPERATIONS:
- CREATE: backend/src/middleware/auth.middleware.ts

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Create JWT token validation middleware function
2. Create role-based permission checking middleware
3. Create rate limiting middleware for auth endpoints
4. Add user injection middleware for authenticated requests
5. Handle token expiration scenarios
6. Add comprehensive error responses
7. Test middleware can be applied to dummy routes
8. Run: git add backend/src/middleware/auth.middleware.ts
9. Run: git commit -m "feat(auth): add JWT and permission middleware"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B3: Create JWT Middleware - Added token validation and role-based access control"
    - Add to Files Created: "backend/src/middleware/auth.middleware.ts: JWT validation and permission checking middleware"

Follow middleware patterns from Express.js and project-context memory requirements.
```

## Backend Task B4: Complete API Controllers
Copy this prompt:
```
PLANNING MODE TASK: Complete Authentication API Controllers

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review backend/src/controllers/auth.controller.ts for current implementation
- Check completed service layer and middleware

Requirements from docs/features/authentication-users/api.md:
- Complete all HTTP endpoints for authentication
- Follow exact API response format from project rules
- Add proper request validation using express-validator
- Add comprehensive error handling
- Ensure all responses match API documentation exactly

FILE OPERATIONS:
- MODIFY: backend/src/controllers/auth.controller.ts (complete all endpoints)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Complete registration endpoint with validation
2. Complete login endpoint with error handling
3. Complete email verification endpoints
4. Complete password reset endpoints
5. Complete user profile management endpoints
6. Complete admin user management endpoints (if applicable)
7. Add proper request validation for all endpoints
8. Test endpoints can be called (use Postman or curl)
9. Run: git add backend/src/controllers/auth.controller.ts
10. Run: git commit -m "feat(auth): complete authentication controller endpoints"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B4: Complete API Controllers - Implemented all authentication HTTP endpoints"
    - Add to Files Modified: "backend/src/controllers/auth.controller.ts: Complete authentication endpoint implementation"

Follow controller patterns from project-context memory and ensure exact API response format compliance.
```

## Backend Task B5: Update API Routes
Copy this prompt:
```
PLANNING MODE TASK: Update Authentication API Routes

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review backend/src/routes/auth.routes.ts for current routes
- Check backend/server.ts for route registration
- Verify middleware and controllers are complete

Requirements from docs/features/authentication-users/api.md:
- Configure all authentication routes with proper middleware
- Apply JWT and permission middleware appropriately
- Add input validation middleware to routes
- Register routes in main server configuration

FILE OPERATIONS:
- MODIFY: backend/src/routes/auth.routes.ts (add all routes)
- MODIFY: backend/server.ts (register auth routes if needed)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Add all authentication routes from API documentation
2. Apply appropriate middleware (auth, roles, rate limiting)
3. Add input validation middleware to each route
4. Ensure routes are properly registered in server.ts
5. Test all routes are accessible
6. Run: git add backend/src/routes/auth.routes.ts backend/server.ts
7. Run: git commit -m "feat(auth): update API routes and middleware configuration"
8. Run: git push origin feature/authentication-users
9. Update docs/features/authentication-users/progress.md:
   - Add to Completed Tasks: "B5: Update API Routes - Configured all auth routes with proper middleware"
   - Add to Files Modified: "backend/src/routes/auth.routes.ts: Complete route configuration with middleware"
   - Add to Files Modified: "backend/server.ts: Auth routes registration (if modified)"

Follow routing patterns from project-context memory and apply middleware correctly.
```

## Backend Task B6: Create Postman Collection
Copy this prompt:
```
PLANNING MODE TASK: Create Postman Testing Collection

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Check if postman/ directory exists in project root
- Verify all backend API endpoints are complete

Requirements from docs/features/authentication-users/api.md:
- Create comprehensive Postman collection for all auth endpoints
- Include example request data and expected responses
- Add automated tests to verify response format
- Include environment variables for testing

FILE OPERATIONS:
- CREATE: postman/authentication-users.postman_collection.json

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Create Postman collection JSON file
2. Add request for each endpoint from api.md
3. Include example request bodies and headers
4. Add automated tests for response validation
5. Include environment variables for tokens and IDs
6. Add workflow tests for registration → login flow
7. Test collection can be imported into Postman
8. Run: git add postman/authentication-users.postman_collection.json
9. Run: git commit -m "feat(auth): add Postman testing collection"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B6: Create Postman Collection - Added comprehensive API testing suite"
    - Add to Files Created: "postman/authentication-users.postman_collection.json: Complete API testing collection"

Create valid Postman Collection v2.1 format JSON with all authentication endpoints.
```

## Frontend Task F1: Update TypeScript Types
Copy this prompt:
```
PLANNING MODE TASK: Update TypeScript Types for Authentication

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/types/auth.types.ts for current types
- Check backend schema completion for reference

Requirements from docs/features/authentication-users/spec.md:
- Update interfaces to match backend schema exactly
- Add interfaces for all API request/response formats
- Add enums for user roles and permissions
- Add utility types for form validation

FILE OPERATIONS:
- MODIFY: frontend/src/types/auth.types.ts (complete type definitions)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Update User interface to match backend user model
2. Add interfaces for all API request/response types
3. Add enums for roles, permissions, token types
4. Add form validation types
5. Export all interfaces for component use
6. Verify no TypeScript errors in project
7. Run: git add frontend/src/types/auth.types.ts
8. Run: git commit -m "feat(auth): update TypeScript types for full auth system"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F1: Update TypeScript Types - Complete type definitions for auth system"
    - Add to Files Modified: "frontend/src/types/auth.types.ts: Complete authentication type definitions"

Follow TypeScript patterns and ensure type safety for all auth operations.
```

## Frontend Task F2: Complete API Service
Copy this prompt:
```
PLANNING MODE TASK: Complete Authentication API Service

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/services/auth.service.ts for current implementation
- Check completed TypeScript types

Requirements from docs/features/authentication-users/api.md:
- Implement function for each backend API endpoint
- Use correct TypeScript types from F1
- Handle errors consistently with user-friendly messages
- Add request/response interceptors for token management

FILE OPERATIONS:
- MODIFY: frontend/src/services/auth.service.ts (complete all API functions)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Implement all authentication API functions
2. Add proper error handling and response parsing
3. Use TypeScript types for all parameters and returns
4. Add token management in request headers
5. Add response interceptors for error handling
6. Test functions can be imported without errors
7. Run: git add frontend/src/services/auth.service.ts
8. Run: git commit -m "feat(auth): complete authentication API service functions"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F2: Complete API Service - All authentication API functions implemented"
    - Add to Files Modified: "frontend/src/services/auth.service.ts: Complete API communication layer"

Follow API service patterns from project-context memory and use proper error handling.
```

## Frontend Task F3: Complete Authentication Forms
Copy this prompt:
```
PLANNING MODE TASK: Complete Authentication Forms

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review existing components in frontend/src/components/auth/
- Check frontend/src/utils/validation.ts for validation utilities

Requirements from docs/features/authentication-users/spec.md:
- Complete all authentication forms with validation
- Use Tailwind CSS for styling (NO other CSS frameworks)
- Include loading states and error display
- Make forms responsive and accessible

FILE OPERATIONS:
- MODIFY: frontend/src/components/auth/RegistrationForm.tsx (enhance existing)
- CREATE: frontend/src/components/auth/LoginForm.tsx
- CREATE: frontend/src/components/auth/ForgotPasswordForm.tsx
- CREATE: frontend/src/components/auth/ResetPasswordForm.tsx

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Enhance existing RegistrationForm with complete validation
2. Create LoginForm with email/password fields
3. Create ForgotPasswordForm for password reset requests
4. Create ResetPasswordForm for password confirmation
5. Add proper form validation using utils/validation.ts
6. Use mock data initially (not real API calls)
7. Style with Tailwind CSS only
8. Test all forms display and validate correctly
9. Run: git add frontend/src/components/auth/
10. Run: git commit -m "feat(auth): complete authentication forms with validation"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F3: Complete Authentication Forms - All auth forms with validation"
    - Add to Files Created: "LoginForm.tsx, ForgotPasswordForm.tsx, ResetPasswordForm.tsx"
    - Add to Files Modified: "RegistrationForm.tsx: Enhanced with complete validation"

Follow React component patterns and use ONLY Tailwind CSS for styling.
```

## Integration Task I1: Connect API Service to Real Backend
Copy this prompt:
```
PLANNING MODE TASK: Connect Frontend to Real Backend APIs

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Verify all backend tasks are complete
- Review frontend/src/services/auth.service.ts implementation

PREREQUISITES: 
- All backend tasks (B1-B7) must be marked complete
- Backend server must be running
- Frontend API service must be complete

Requirements:
- Replace mock data with real API calls
- Configure proper API base URLs
- Handle authentication tokens in requests
- Test complete authentication flow works

FILE OPERATIONS:
- MODIFY: frontend/src/services/auth.service.ts (connect to real APIs)

DO NOT CREATE OR MODIFY any other files unless backend connection requires it.

Implementation steps:
1. Verify backend server is running on correct port
2. Update API service to use real backend URLs
3. Configure authentication headers for protected endpoints
4. Add token refresh logic for expired tokens
5. Test registration → verification → login flow
6. Test error handling with various scenarios
7. Run: git add frontend/src/services/auth.service.ts
8. Run: git commit -m "feat(auth): connect frontend to real backend APIs"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I1: Connect API Service to Real Backend - Frontend-backend integration complete"
    - Add to Files Modified: "frontend/src/services/auth.service.ts: Connected to real backend APIs"

Test end-to-end authentication flow and verify network requests in browser developer tools.
```

## USAGE INSTRUCTIONS

### For Backend Developer:
1. Enable Planning Mode in Windsurf
2. Start with Task B1 prompt (copy entire prompt above)
3. After B1 completes, run Task B2 prompt
4. Continue through B3, B4, B5, B6, B7 in order
5. Each task will automatically update progress.md
6. After B7, backend is ready for frontend integration

### For Frontend Developer (Can work in parallel):
1. Enable Planning Mode in Windsurf
2. Start with Task F1 prompt (copy entire prompt above)
3. Continue through F2, F3, F4, F5, F6, F7, F8 in order
4. Use mock data until integration phase
5. After F8, frontend is ready for backend integration

### For Integration (Backend dev pulls frontend code):
1. Backend developer pulls latest frontend code
2. Run Integration tasks I1, I2, I3, I4, I5, I6 in order
3. Each integration task connects a piece of the frontend to backend
4. After I6, entire authentication system is complete

### Important Notes:
- Each prompt explicitly states which files to create/modify
- Planning Mode will track progress automatically
- Git operations are included in each task
- Progress documentation is updated after each task
- DO NOT skip tasks or change the order
- Verify prerequisites before starting integration tasks
