# User Login & User Logout Tasks

## Backend Tasks (Complete these first)
Each task should be completable and testable with Postman independently.

### Task B1: Create MongoDB Schemas (2 hours)
**What this does**: Defines how authentication data is stored in database
**Details**: 
- Create `backend/src/models/user.model.ts` - Enhanced user schema with auth fields
- Create `backend/src/models/user-session.model.ts` - User sessions for refresh tokens
- Create `backend/src/models/blacklisted-token.model.ts` - Token blacklist for logout
- Include all fields from spec.md with proper indexes
- Add validation at schema level for email, password requirements
- Add pre-save hooks for password hashing
**Test**: Can create documents directly in MongoDB, indexes are working

### Task B2: Create Authentication Service (4 hours)
**What this does**: Core business logic for login/logout operations
**Details**:
- Create `backend/src/services/auth.service.ts`
- Implement `loginUser(email, password, rememberMe)` with credential validation
- Implement `logoutUser(userId, refreshToken)` with token blacklisting
- Implement `refreshToken(refreshToken)` for token renewal
- Implement `verifyToken(accessToken)` for token validation
- Add rate limiting logic for failed login attempts
- Add password hashing/comparison utilities
- Handle account locking after failed attempts
**Test**: Can call service functions in Node console with mock data

### Task B3: Create JWT Utilities (2 hours)
**What this does**: Token generation and validation utilities
**Details**:
- Create `backend/src/utils/jwt.util.ts`
- Implement `generateAccessToken(payload)` - 15 minute expiry
- Implement `generateRefreshToken(payload)` - 7 day expiry
- Implement `verifyAccessToken(token)` with blacklist checking
- Implement `verifyRefreshToken(token)` 
- Implement `blacklistToken(token)` for logout
- Add token payload interfaces and types
**Test**: Can generate and verify tokens, blacklist functionality works

### Task B4: Create Authentication Controller (3 hours)
**What this does**: HTTP request handlers for authentication endpoints
**Details**:
- Create `backend/src/controllers/auth.controller.ts`
- Implement `login` - handles POST /api/v1/auth/login
- Implement `logout` - handles POST /api/v1/auth/logout
- Implement `refreshToken` - handles POST /api/v1/auth/refresh
- Implement `getCurrentUser` - handles GET /api/v1/auth/me
- Implement `verifyToken` - handles POST /api/v1/auth/verify-token
- Follow exact API spec from api.md
- Add proper error handling and validation
- Set httpOnly cookies for tokens
**Test**: Controllers can be imported and functions exist

### Task B5: Create Authentication Routes (1 hour)
**What this does**: HTTP routes and middleware setup
**Details**:
- Create `backend/src/routes/auth.routes.ts`
- Define all auth endpoints with proper HTTP methods
- Add authentication middleware for protected routes
- Add rate limiting middleware for login attempts
- Add validation middleware for request bodies
- Export router for main app integration
**Test**: Routes can be imported, middleware applied correctly

### Task B6: Create Authentication Middleware (2 hours)
**What this does**: JWT token validation and user context
**Details**:
- Create `backend/src/middleware/auth.middleware.ts`
- Implement `authenticateToken` middleware for protected routes
- Implement `rateLimitLogin` middleware for login attempts
- Implement `validateLoginRequest` middleware for input validation
- Add user context to request object
- Handle token refresh automatically where possible
**Test**: Middleware functions can be imported and applied

### Task B7: Create Postman Collection (1 hour)
**What this does**: Testing suite for all authentication endpoints
**Details**:
- Create `postman/auth.postman_collection.json`
- Add requests for login, logout, refresh, me, verify-token
- Include example data and environment variables
- Add tests to verify response formats
- Include error scenario tests (invalid credentials, expired tokens)
**Test**: Run entire collection successfully against local server

### Task B8: Update Progress Documentation (30 min)
**What this does**: Track backend completion
**Details**:
- Update `docs/features/user-login-logout/progress.md`
- Mark all backend tasks complete
- Document any decisions or changes made
- Note API endpoints ready for frontend integration
- Add any additional setup notes

## Frontend Tasks (Can start in parallel)
Each task should show visible results in browser.

### Task F1: Create TypeScript Types (1 hour)
**What this does**: Type safety for authentication data structures
**Details**:
- Create `frontend/src/types/auth.types.ts`
- Define `User` interface matching backend user schema
- Define `LoginRequest`, `LoginResponse` interfaces
- Define `AuthError`, `AuthState` interfaces
- Export all interfaces for consistent typing
**Test**: No TypeScript errors in project, IntelliSense works

### Task F2: Create Authentication API Service (2 hours)
**What this does**: Functions to call backend authentication APIs
**Details**:
- Create `frontend/src/services/auth.service.ts`
- Implement `login(email, password, rememberMe)` function
- Implement `logout()` function
- Implement `getCurrentUser()` function
- Implement `refreshToken()` function
- Handle errors consistently with proper types
- Add HTTP interceptors for automatic token refresh
**Test**: Can import and see IntelliSense working, mock responses

### Task F3: Create Authentication Context (2 hours)
**What this does**: Global state management for authentication
**Details**:
- Create `frontend/src/contexts/auth.context.tsx`
- Implement `AuthProvider` with useReducer for state
- Provide `login`, `logout`, `checkAuth` functions
- Handle automatic token refresh
- Persist authentication state
- Export `useAuth` hook for components
**Test**: Context can be imported and provides correct types

### Task F4: Create Login Form Component (3 hours)
**What this does**: User interface for email/password login
**Details**:
- Create `frontend/src/components/auth/LoginForm.tsx`
- Email and password input fields with validation
- Remember me checkbox option
- Loading state during login
- Error message display
- Form submission handling
- Responsive design with Tailwind CSS
**Test**: Component renders, form validation works, shows loading states

### Task F5: Create User Navigation Component (2 hours)
**What this does**: Show login/logout buttons in header/navigation
**Details**:
- Create `frontend/src/components/auth/UserNavigation.tsx`
- Show login button when not authenticated
- Show user dropdown with logout when authenticated
- Handle logout confirmation
- Responsive design for mobile/desktop
**Test**: Component renders correctly for both auth states

### Task F6: Create Protected Route Component (2 hours)
**What this does**: Wrapper for routes requiring authentication
**Details**:
- Create `frontend/src/components/auth/ProtectedRoute.tsx`
- Check authentication status before rendering
- Redirect to login if not authenticated
- Show loading spinner during auth check
- Handle auth state changes
**Test**: Can wrap components, redirects work correctly

### Task F7: Add Authentication Routes (1 hour)
**What this does**: Setup routing for login page and protected areas
**Details**:
- Update Next.js app router configuration
- Add `/login` page route
- Add `/dashboard` as example protected route
- Setup proper layouts and navigation
- Add redirect logic after login
**Test**: Can navigate to login page, protected routes redirect properly

### Task F8: Create Auth Status Hook (1 hour)
**What this does**: Custom hook for authentication state management
**Details**:
- Create `frontend/src/hooks/useAuthStatus.ts`
- Provide loading, authenticated, user states
- Handle automatic token refresh
- Export convenient boolean flags
**Test**: Hook works in components, provides correct states

### Task F9: Update Progress Documentation (30 min)
**What this does**: Track frontend completion
**Details**:
- Update `docs/features/user-login-logout/progress.md`
- Mark all frontend tasks complete
- Note ready for integration phase
- List all component files created

## Integration Tasks (After both complete)
Backend developer pulls frontend code and connects everything.

### Task I1: Connect API Service to Real Backend (2 hours)
**What this does**: Replace mock data with real API calls
**Prerequisites**: Backend dev has pulled latest frontend code
**Details**:
- Update `frontend/src/services/auth.service.ts`
- Point to actual backend URLs (http://localhost:5000/api/v1/auth/)
- Ensure authentication headers and cookies handled correctly
- Handle all error cases from backend API
- Test with actual backend running locally
**Test**: Network tab shows real API calls, responses match expected format

### Task I2: Connect Authentication Context (2 hours)
**What this does**: Wire up auth context with real authentication flow
**Details**:
- Update `AuthProvider` to use real auth service
- Handle login success/failure states
- Implement automatic token refresh logic
- Handle logout cleanup properly
- Persist user session across browser refreshes
**Test**: Login/logout works end-to-end, state persists correctly

### Task I3: Connect Login Form to Authentication (1 hour)
**What this does**: Make login form submit to real backend
**Details**:
- Update `LoginForm.tsx` to use auth context
- Handle real validation errors from backend
- Show appropriate success/error messages
- Redirect to dashboard after successful login
- Handle rate limiting and account lockout errors
**Test**: Can login with real credentials, errors displayed correctly

### Task I4: Connect Protected Routes (1 hour)
**What this does**: Secure routes with real authentication check
**Details**:
- Update `ProtectedRoute.tsx` to use auth context
- Check real authentication status
- Handle token expiry gracefully
- Redirect to login with return URL
**Test**: Protected routes work, redirects maintain destination

### Task I5: Connect User Navigation (1 hour)
**What this does**: Show real user data and handle logout
**Details**:
- Update `UserNavigation.tsx` to use auth context
- Display real user name/email
- Handle logout API call
- Update UI state after logout
**Test**: User dropdown shows real data, logout works completely

### Task I6: End-to-End Testing (2 hours)
**What this does**: Verify complete authentication flow works
**Details**:
- Test complete login flow from start to finish
- Test logout and session cleanup
- Test token refresh functionality
- Test protected route access
- Test error scenarios (network, invalid credentials)
- Test on mobile and desktop viewports
**Test**: All authentication operations work smoothly

### Task I7: Final Documentation Update (30 min)
**What this does**: Mark feature complete and document final state
**Details**:
- Update `docs/features/user-login-logout/progress.md`
- Mark feature COMPLETE
- Document any issues found during integration
- Update main feature index with completion status
- Add deployment notes if any
