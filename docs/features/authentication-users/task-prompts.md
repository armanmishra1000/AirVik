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
## Backend Task B7: Update Progress Documentation
Copy this prompt:
```
PLANNING MODE TASK: Update Progress Documentation for Backend Completion

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for current status
- Verify all previous backend tasks (B1-B6) are marked complete
- Review all backend files created/modified

Requirements:
- Mark backend development as COMPLETE
- Document all implemented features and endpoints
- Update completion percentages
- List all files created and modified
- Add notes about backend readiness for integration

FILE OPERATIONS:
- MODIFY: docs/features/authentication-users/progress.md (update backend status)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Review all completed backend tasks (B1-B6)
2. Update backend completion status to 100%
3. List all backend files created and modified
4. Document all implemented API endpoints
5. Add backend readiness notes for frontend integration
6. Update overall project completion percentage
7. Run: git add docs/features/authentication-users/progress.md
8. Run: git commit -m "docs(auth): mark backend development complete"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "B7: Update Progress Documentation - Backend development marked complete"
    - Update Backend Status: "COMPLETE - All API endpoints ready for frontend integration"
    - List all backend files in Files Created/Modified sections

Ensure documentation accurately reflects all implemented backend functionality.
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

## Frontend Task F4: Complete User Management Components
Copy this prompt:
```
PLANNING MODE TASK: Complete User Management Components

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/components/user/ directory for existing components
- Check frontend/src/components/auth/ for related authentication components

Requirements from docs/features/authentication-users/spec.md:
- Enhance existing UserProfile.tsx and EditProfile.tsx with complete functionality
- Create ChangePassword.tsx component for password changes
- Create UsersList.tsx component for admin user management (if applicable)
- Create RoleManagement.tsx component for role changes (if applicable)
- Add proper form validation and error handling
- Use mock data initially (not real API calls)
- Style with Tailwind CSS only

FILE OPERATIONS:
- MODIFY: frontend/src/components/user/UserProfile.tsx (enhance functionality)
- MODIFY: frontend/src/components/user/EditProfile.tsx (enhance functionality)
- CREATE: frontend/src/components/user/ChangePassword.tsx
- CREATE: frontend/src/components/admin/UsersList.tsx (if admin features needed)
- CREATE: frontend/src/components/admin/RoleManagement.tsx (if admin features needed)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Enhance UserProfile with complete user information display
2. Enhance EditProfile with all editable user fields
3. Create ChangePassword component with current/new password fields
4. Create admin components for user management (if applicable)
5. Add proper form validation using utils/validation.ts
6. Add loading states and error handling
7. Style all components with Tailwind CSS
8. Test all components display and validate correctly
9. Run: git add frontend/src/components/user/ frontend/src/components/admin/
10. Run: git commit -m "feat(auth): complete user management components"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F4: Complete User Management Components - Enhanced profile and admin components"
    - Add to Files Created: "ChangePassword.tsx, UsersList.tsx, RoleManagement.tsx"
    - Add to Files Modified: "UserProfile.tsx, EditProfile.tsx - enhanced functionality"

Follow React component patterns and use ONLY Tailwind CSS for styling.
```

## Frontend Task F5: Update Authentication Context
Copy this prompt:
```
PLANNING MODE TASK: Update Authentication Context

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/contexts/AuthContext.tsx for current implementation
- Check frontend/src/types/auth.types.ts for available types
- Review frontend/src/services/auth.service.ts for available functions

Requirements from docs/features/authentication-users/spec.md:
- Complete AuthContext with all authentication state management
- Add user session persistence across page reloads
- Add token management (access and refresh tokens)
- Add role-based permission checking
- Add authentication status tracking
- Use mock data initially (not real API calls)
- Handle loading states and errors

FILE OPERATIONS:
- MODIFY: frontend/src/contexts/AuthContext.tsx (complete all functionality)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Complete user state management in AuthContext
2. Add token storage and retrieval logic (localStorage/sessionStorage)
3. Add session persistence across browser refreshes
4. Add role-based permission checking functions
5. Add authentication status tracking (loading, authenticated, etc.)
6. Add error handling for authentication failures
7. Test context provides all needed auth functionality
8. Run: git add frontend/src/contexts/AuthContext.tsx
9. Run: git commit -m "feat(auth): complete authentication context functionality"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F5: Update Authentication Context - Complete auth state management"
    - Add to Files Modified: "frontend/src/contexts/AuthContext.tsx - complete authentication context"

Ensure context provides all authentication functionality needed by components.
```

## Frontend Task F6: Update Route Guards
Copy this prompt:
```
PLANNING MODE TASK: Update Route Guards

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/components/auth/RouteGuard.tsx for current implementation
- Check frontend/src/contexts/AuthContext.tsx for authentication functions
- Review frontend/src/types/auth.types.ts for user roles

Requirements from docs/features/authentication-users/spec.md:
- Enhance existing RouteGuard.tsx with complete route protection
- Create RoleGuard.tsx for role-based access control
- Add redirect logic for unauthorized access
- Add loading states while checking authentication
- Handle different user roles (customer, manager, admin)
- Add guest-only routes (login, register for unauthenticated users)

FILE OPERATIONS:
- MODIFY: frontend/src/components/auth/RouteGuard.tsx (enhance route protection)
- CREATE: frontend/src/components/auth/RoleGuard.tsx
- CREATE: frontend/src/components/auth/GuestGuard.tsx (for unauthenticated-only routes)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Enhance RouteGuard with complete authentication checking
2. Create RoleGuard for role-based route protection
3. Create GuestGuard for login/register pages (redirect if authenticated)
4. Add loading states while authentication is being verified
5. Add proper redirect logic for unauthorized access
6. Add support for different user roles and permissions
7. Test guards work correctly with different user states
8. Run: git add frontend/src/components/auth/
9. Run: git commit -m "feat(auth): complete route guards and role-based access"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F6: Update Route Guards - Complete route protection and role-based access"
    - Add to Files Created: "RoleGuard.tsx, GuestGuard.tsx"
    - Add to Files Modified: "RouteGuard.tsx - enhanced route protection"

Ensure all routes are properly protected based on authentication and role requirements.
```

## Frontend Task F7: Add Authentication Routes and Navigation
Copy this prompt:
```
PLANNING MODE TASK: Add Authentication Routes and Navigation

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Review frontend/src/app/ directory structure for Next.js routing
- Check frontend/src/components/layout/Navigation.tsx for current navigation
- Review all completed authentication components

Requirements from docs/features/authentication-users/spec.md:
- Add all authentication routes to Next.js app directory
- Update main navigation with authentication links
- Add user profile dropdown in navigation
- Add logout functionality in navigation
- Add conditional navigation based on authentication status
- Add proper route structure for all auth pages

FILE OPERATIONS:
- CREATE: frontend/src/app/auth/login/page.tsx
- CREATE: frontend/src/app/auth/register/page.tsx
- CREATE: frontend/src/app/auth/forgot-password/page.tsx
- CREATE: frontend/src/app/auth/reset-password/page.tsx
- CREATE: frontend/src/app/auth/verify-email/page.tsx
- CREATE: frontend/src/app/profile/page.tsx
- CREATE: frontend/src/app/profile/edit/page.tsx
- MODIFY: frontend/src/components/layout/Navigation.tsx (add auth navigation)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Create all authentication page routes in app directory
2. Create user profile and edit profile routes
3. Update main navigation with authentication links
4. Add user profile dropdown with logout functionality
5. Add conditional navigation based on authentication status
6. Test all routes are accessible and navigation works
7. Run: git add frontend/src/app/ frontend/src/components/layout/Navigation.tsx
8. Run: git commit -m "feat(auth): add authentication routes and navigation"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F7: Add Authentication Routes and Navigation - Complete routing and navigation"
    - Add to Files Created: "All auth page routes in app directory"
    - Add to Files Modified: "Navigation.tsx - added authentication navigation"

Ensure all authentication pages are accessible through proper routes and navigation.
```

## Frontend Task F8: Update Progress Documentation
Copy this prompt:
```
PLANNING MODE TASK: Update Progress Documentation for Frontend Completion

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for current status
- Verify all previous frontend tasks (F1-F7) are marked complete
- Review all frontend files created/modified

Requirements:
- Mark frontend development as COMPLETE
- Document all implemented components and features
- Update completion percentages
- List all files created and modified
- Add notes about frontend readiness for backend integration

FILE OPERATIONS:
- MODIFY: docs/features/authentication-users/progress.md (update frontend status)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Review all completed frontend tasks (F1-F7)
2. Update frontend completion status to 100%
3. List all frontend files created and modified
4. Document all implemented components and features
5. Add frontend readiness notes for backend integration
6. Update overall project completion percentage
7. Run: git add docs/features/authentication-users/progress.md
8. Run: git commit -m "docs(auth): mark frontend development complete"
9. Run: git push origin feature/authentication-users
10. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "F8: Update Progress Documentation - Frontend development marked complete"
    - Update Frontend Status: "COMPLETE - All components ready for API integration"
    - List all frontend files in Files Created/Modified sections

Ensure documentation accurately reflects all implemented frontend functionality.
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

## Integration Task I2: Connect Authentication Forms to API
Copy this prompt:
```
PLANNING MODE TASK: Connect Authentication Forms to Backend API

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Verify Task I1 (API Service connection) is complete
- Review all authentication form components in frontend/src/components/auth/
- Verify backend authentication endpoints are working

PREREQUISITES:
- Task I1 (Connect API Service) must be complete
- All backend tasks (B1-B7) must be complete
- Backend server must be running
- All frontend authentication forms must be complete

Requirements:
- Connect all authentication forms to real backend APIs
- Replace mock data with actual API service calls
- Handle API responses and errors properly
- Show loading states during API calls
- Display success/error messages from backend
- Test complete authentication flow

FILE OPERATIONS:
- MODIFY: frontend/src/components/auth/RegistrationForm.tsx (connect to API)
- MODIFY: frontend/src/components/auth/LoginForm.tsx (connect to API)
- MODIFY: frontend/src/components/auth/ForgotPasswordForm.tsx (connect to API)
- MODIFY: frontend/src/components/auth/ResetPasswordForm.tsx (connect to API)
- MODIFY: frontend/src/components/auth/VerificationResult.tsx (connect to API)
- MODIFY: frontend/src/components/auth/ResendVerification.tsx (connect to API)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Update RegistrationForm to use real registration API
2. Update LoginForm to use real authentication API
3. Update password reset forms to use real backend endpoints
4. Update email verification components to use real API
5. Add proper error handling for all API responses
6. Add loading states during form submissions
7. Test complete registration → verification → login flow
8. Run: git add frontend/src/components/auth/
9. Run: git commit -m "feat(auth): connect authentication forms to backend API"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I2: Connect Authentication Forms to API - All auth forms connected to backend"
    - Add Integration milestone: "Authentication forms fully functional with backend"

Test the complete authentication flow works end-to-end with real backend.
```

## Integration Task I3: Connect User Management to API
Copy this prompt:
```
PLANNING MODE TASK: Connect User Management Components to Backend API

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Verify Task I2 (Authentication Forms API connection) is complete
- Review user management components in frontend/src/components/user/
- Verify backend user management endpoints are working

PREREQUISITES:
- Task I2 (Connect Authentication Forms) must be complete
- All backend user management endpoints must be working
- Frontend user management components must be complete
- User authentication must be working (from I2)

Requirements:
- Connect user profile components to backend user endpoints
- Enable profile editing with real API saves
- Connect password change functionality to backend
- Connect admin user management interface (if applicable)
- Add real-time data refresh after updates
- Handle API errors gracefully in UI

FILE OPERATIONS:
- MODIFY: frontend/src/components/user/UserProfile.tsx (connect to API)
- MODIFY: frontend/src/components/user/EditProfile.tsx (connect to API)
- MODIFY: frontend/src/components/user/ChangePassword.tsx (connect to API)
- MODIFY: frontend/src/components/admin/UsersList.tsx (connect to API, if exists)
- MODIFY: frontend/src/components/admin/RoleManagement.tsx (connect to API, if exists)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Connect UserProfile to backend profile retrieval API
2. Connect EditProfile to backend profile update API
3. Connect ChangePassword to backend password change API
4. Connect admin components to backend admin APIs (if applicable)
5. Add proper error handling for all API responses
6. Add loading states during API operations
7. Add data refresh after successful updates
8. Test all user management operations work correctly
9. Run: git add frontend/src/components/user/ frontend/src/components/admin/
10. Run: git commit -m "feat(auth): connect user management components to backend API"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I3: Connect User Management to API - User management fully functional"
    - Add Integration milestone: "User management fully functional with backend"

Test that users can view, edit profile, change password, and see changes persist.
```

## Integration Task I4: Implement Token Refresh Logic
Copy this prompt:
```
PLANNING MODE TASK: Implement Automatic Token Refresh and Authentication Persistence

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Verify Task I3 (User Management API connection) is complete
- Review frontend/src/contexts/AuthContext.tsx for current token handling
- Review frontend/src/services/auth.service.ts for token management
- Check backend JWT token expiration settings

PREREQUISITES:
- Task I3 (Connect User Management) must be complete
- Backend JWT refresh token endpoints must be working
- Authentication context must be complete
- API service must be connected to backend

Requirements:
- Implement automatic JWT token refresh before expiration
- Add token refresh on API 401 responses
- Handle refresh token expiration (redirect to login)
- Add authentication persistence across browser sessions
- Test token refresh scenarios and edge cases

FILE OPERATIONS:
- MODIFY: frontend/src/contexts/AuthContext.tsx (add token refresh logic)
- MODIFY: frontend/src/services/auth.service.ts (enhance token management)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Add automatic token refresh timer in AuthContext
2. Add API response interceptor to handle 401 errors with token refresh
3. Add refresh token expiration handling with redirect to login
4. Add authentication persistence across browser sessions
5. Add token refresh retry logic for failed attempts
6. Test token refresh works automatically
7. Test authentication persists across page reloads
8. Test refresh token expiration handling
9. Run: git add frontend/src/contexts/AuthContext.tsx frontend/src/services/auth.service.ts
10. Run: git commit -m "feat(auth): implement automatic token refresh and persistence"
11. Run: git push origin feature/authentication-users
12. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I4: Implement Token Refresh Logic - Authentication persistence complete"
    - Add Integration milestone: "Authentication persistence and token management complete"

Test that authentication persists across page reloads and tokens refresh automatically.
```

## Integration Task I5: End-to-End Testing
Copy this prompt:
```
PLANNING MODE TASK: Comprehensive End-to-End Authentication System Testing

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for completed work
- Verify Task I4 (Token Refresh Logic) is complete
- Verify backend server is running and all endpoints are working
- Verify frontend application is running without errors

PREREQUISITES:
- Task I4 (Token Refresh Logic) must be complete
- Backend server must be running without errors
- Frontend application must be running without errors
- All authentication components must be connected to backend

Requirements:
- Test complete user registration → email verification → login flow
- Test password reset flow from request to completion
- Test user profile management (view, edit, password change)
- Test role-based access control (if admin features implemented)
- Test error scenarios (invalid data, network errors, etc.)
- Test responsive behavior on mobile devices
- Verify security features (token expiration, logout, etc.)

FILE OPERATIONS:
- Any bug fixes discovered during testing
- CREATE: docs/testing/authentication-end-to-end-test-results.md (optional)

Implementation steps:
1. Test complete registration flow: register → verify email → login
2. Test password reset flow: request reset → receive email → reset password
3. Test user profile management: view profile → edit profile → change password
4. Test authentication persistence: refresh page, close/reopen browser
5. Test token refresh: wait for token expiration, verify auto-refresh
6. Test error handling: invalid credentials, network errors, validation errors
7. Test responsive design on mobile devices
8. Test role-based access (if admin features exist)
9. Fix any bugs discovered during testing
10. Run: git add . (any bug fixes)
11. Run: git commit -m "feat(auth): final integration testing and bug fixes"
12. Run: git push origin feature/authentication-users
13. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I5: End-to-End Testing - Full authentication system tested and verified"
    - Add Integration milestone: "Full authentication system tested and verified"
    - Document any issues found and resolved

Ensure all authentication operations work smoothly across different scenarios.
```

## Integration Task I6: Final Documentation Update
Copy this prompt:
```
PLANNING MODE TASK: Mark Authentication Feature as Complete

First, analyze these existing files:
- Check docs/features/authentication-users/progress.md for current status
- Verify all tasks (B1-B7, F1-F8, I1-I5) are marked complete
- Review all files created and modified throughout the project
- Verify end-to-end testing is complete and successful

PREREQUISITES:
- Task I5 (End-to-End Testing) must be complete
- All backend and frontend tasks must be complete
- All integration testing must be successful
- No critical bugs should remain

Requirements:
- Mark entire authentication feature as COMPLETE
- Document comprehensive summary of implemented functionality
- Update main project progress documentation
- Create final summary of all files created/modified
- Note any remaining technical debt or future improvements
- Prepare for code review and merge to main branch

FILE OPERATIONS:
- MODIFY: docs/features/authentication-users/progress.md (mark feature complete)
- MODIFY: README.md (update main project status, if applicable)

DO NOT CREATE OR MODIFY any other files.

Implementation steps:
1. Review all completed tasks (B1-B7, F1-F8, I1-I5)
2. Mark entire authentication feature as COMPLETE ✅
3. Update overall project completion percentage
4. Create comprehensive summary of implemented functionality
5. List all files created and modified with descriptions
6. Document any technical debt or future improvement areas
7. Add notes about code review readiness
8. Run: git add docs/features/authentication-users/progress.md README.md
9. Run: git commit -m "docs(auth): mark authentication feature complete"
10. Run: git push origin feature/authentication-users
11. Update docs/features/authentication-users/progress.md:
    - Add to Completed Tasks: "I6: Final Documentation Update - Authentication feature marked complete"
    - Update FEATURE STATUS: "COMPLETE ✅"
    - Add note: "Ready for: Code review and merge to main branch"

Ensure documentation provides complete picture of implemented authentication system.
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
