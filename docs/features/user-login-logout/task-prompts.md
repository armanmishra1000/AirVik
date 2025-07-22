# Task Prompt Templates for User Login & User Logout

## Backend Task B1: MongoDB Schemas
Copy this prompt:
```
Create MongoDB schemas for authentication based on:
- Requirements in docs/features/user-login-logout/spec.md
- VikBooking reference shows user_login, user_password fields and session management

Create files:
1. backend/src/models/user.model.ts - Enhanced user schema
2. backend/src/models/user-session.model.ts - Session management
3. backend/src/models/blacklisted-token.model.ts - Token blacklist

Include:
1. User schema: email, username, password (bcrypt), firstName, lastName, phone, role, emailVerified, isActive, lastLoginAt, failedLoginAttempts, accountLockedUntil
2. Session schema: userId, refreshToken (hashed), deviceInfo, ipAddress, isActive, expiresAt
3. Blacklist schema: token (hashed), expiresAt
4. Indexes on: email, refreshToken, token, expiresAt
5. Pre-save hooks for password hashing
6. Virtual fields for full name display

Use Mongoose with TypeScript. Follow MongoDB schema patterns from project context.
```

## Backend Task B2: Authentication Service
Copy this prompt:
```
Create the authentication service for user login/logout business logic.

Create file: backend/src/services/auth.service.ts

Based on VikBooking analysis, implement these operations:
- Login with username/password validation (from application.php login function)
- Session management with remember me option
- Account locking after failed attempts
- Token generation and validation

Include these methods:
1. loginUser(email, password, rememberMe) - with rate limiting validation
2. logoutUser(userId, refreshToken) - with token blacklisting
3. refreshToken(refreshToken) - generate new access token
4. verifyToken(accessToken) - check token validity and blacklist
5. hashPassword(password) - bcrypt with 12+ rounds
6. comparePassword(password, hashedPassword) - secure comparison
7. lockAccount(userId) - implement progressive locking
8. resetFailedAttempts(userId) - on successful login

Business rules to implement:
- Max 5 failed attempts per email per 15 minutes
- Progressive account locking: 1min, 5min, 15min, 1hour
- JWT access tokens: 15 minute expiry
- JWT refresh tokens: 7 day expiry (30 days if rememberMe)
- Token blacklisting on logout

Follow service pattern from project context. Handle all errors properly.
```

## Backend Task B3: JWT Utilities
Copy this prompt:
```
Create JWT token utilities for authentication system.

Create file: backend/src/utils/jwt.util.ts

Implement these functions:
1. generateAccessToken(payload) - 15 minute expiry, include userId, email, role
2. generateRefreshToken(payload) - 7 day expiry, include userId only
3. verifyAccessToken(token) - verify and check blacklist
4. verifyRefreshToken(token) - verify refresh token
5. blacklistToken(token) - add to blacklist collection
6. getTokenPayload(token) - decode without verification
7. isTokenBlacklisted(token) - check against database

Configuration:
- Use JWT_SECRET from environment
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days (configurable for rememberMe)
- Include proper TypeScript interfaces for payloads

Security considerations:
- Hash tokens before storing in blacklist
- Clean up expired blacklist entries
- Validate token format before processing

Follow utility pattern from project context.
```

## Backend Task B4: Authentication Controller
Copy this prompt:
```
Create authentication controller for HTTP request handling.

Create file: backend/src/controllers/auth.controller.ts

Based on VikBooking login/logout functions and API spec, implement:
1. login - POST /api/v1/auth/login
2. logout - POST /api/v1/auth/logout  
3. refreshToken - POST /api/v1/auth/refresh
4. getCurrentUser - GET /api/v1/auth/me
5. verifyToken - POST /api/v1/auth/verify-token

Request/response format from docs/features/user-login-logout/api.md:
- Login: email, password, rememberMe → user data + tokens in cookies
- Logout: authenticated request → clear cookies and blacklist tokens
- Refresh: use refresh cookie → new access token
- Me: authenticated request → current user data
- Verify: check access token → validity status

Implementation details:
- Set httpOnly cookies for access_token and refresh_token
- Follow exact API response format from project context
- Handle validation errors with proper error codes
- Implement rate limiting checks
- Add CSRF token handling
- Log authentication events for security

Use controller pattern from project context. Import auth service and JWT utils.
```

## Backend Task B5: Authentication Routes
Copy this prompt:
```
Create authentication routes and middleware setup.

Create file: backend/src/routes/auth.routes.ts

Define routes:
- POST /login - with rate limiting and validation middleware
- POST /logout - with authentication middleware
- POST /refresh - no authentication needed (uses cookie)
- GET /me - with authentication middleware
- POST /verify-token - with authentication middleware

Middleware to apply:
1. Rate limiting on login (5 attempts per email per 15min)
2. Input validation for login request body
3. Authentication check for protected routes
4. CSRF token validation for state-changing operations

Route structure:
```typescript
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken, rateLimitLogin, validateLoginRequest } from '../middleware/auth.middleware';

const router = Router();
// Define each route with appropriate middleware
export default router;
```

Follow routing patterns from project context. Export router for main app.
```

## Backend Task B6: Authentication Middleware
Copy this prompt:
```
Create authentication middleware for token validation and security.

Create file: backend/src/middleware/auth.middleware.ts

Implement middleware functions:
1. authenticateToken - validate JWT access token from cookie/header
2. rateLimitLogin - limit login attempts per IP and per email
3. validateLoginRequest - validate email/password input
4. csrfProtection - validate CSRF tokens
5. logAuthEvent - log authentication events for security

authenticateToken middleware should:
- Extract token from Authorization header or access_token cookie
- Verify token using JWT utils
- Check if token is blacklisted
- Add user data to req.user
- Handle expired tokens gracefully
- Return 401 for invalid/missing tokens

rateLimitLogin middleware should:
- Track attempts per IP address (10 per 15min)
- Track attempts per email address (5 per 15min) 
- Store in Redis or memory cache
- Return 429 Too Many Requests when exceeded
- Include Retry-After header

Follow middleware patterns from project context. Use proper TypeScript types.
```

## Backend Task B7: Postman Collection
Copy this prompt:
```
Create comprehensive Postman collection for authentication testing.

Create file: postman/auth.postman_collection.json

Include requests for:
1. POST Login - valid credentials, invalid credentials, rate limiting
2. POST Logout - authenticated user, invalid token
3. POST Refresh Token - valid refresh token, expired token
4. GET Current User - authenticated, unauthenticated
5. POST Verify Token - valid token, invalid token, expired token

Environment variables:
- base_url: http://localhost:5000/api/v1/auth
- valid_email: test@example.com
- valid_password: Password123!
- access_token: (populated from login response)
- refresh_token: (populated from login response)

Test scripts for each request:
- Verify response status codes
- Verify response structure matches API spec
- Extract tokens from login response
- Verify error codes match documentation

Pre-request scripts:
- Set proper headers (Content-Type, Authorization)
- Clear old tokens for fresh tests

Follow Postman collection structure with folders for different scenarios.
```

## Frontend Task F1: TypeScript Types
Copy this prompt:
```
Create TypeScript interfaces for authentication data structures.

Create file: frontend/src/types/auth.types.ts

Define interfaces matching backend schemas:
1. User - user data from backend
2. LoginRequest - login form data
3. LoginResponse - API response structure
4. AuthError - error response structure
5. AuthState - authentication context state

User interface should include:
- id, email, firstName, lastName, username, phone
- role, emailVerified, isActive, lastLoginAt, createdAt

AuthState interface should include:
- user: User | null
- isAuthenticated: boolean
- isLoading: boolean
- error: AuthError | null

API interfaces should match:
- docs/features/user-login-logout/api.md response formats
- Project context API response format (success, data, message/error)

Export all interfaces for use throughout frontend application.
Use proper TypeScript conventions and naming.
```

## Frontend Task F2: Authentication API Service
Copy this prompt:
```
Create authentication API service for backend integration.

Create file: frontend/src/services/auth.service.ts

Implement functions matching backend API endpoints:
1. login(email, password, rememberMe) - POST /api/v1/auth/login
2. logout() - POST /api/v1/auth/logout
3. getCurrentUser() - GET /api/v1/auth/me
4. refreshToken() - POST /api/v1/auth/refresh
5. verifyToken() - POST /api/v1/auth/verify-token

Implementation details:
- Use fetch API with proper error handling
- Handle cookies automatically (credentials: 'include')
- Parse JSON responses with type safety
- Throw typed errors for different status codes
- Add request/response interceptors for token refresh
- Follow API response format from project context

Error handling:
- 400: Validation errors
- 401: Authentication errors  
- 429: Rate limiting
- 500: Server errors

Initially use mock data for parallel development, with TODO comments for real API integration.
```

## Frontend Task F3: Authentication Context
Copy this prompt:
```
Create React context for global authentication state management.

Create file: frontend/src/contexts/auth.context.tsx

Implement with useReducer pattern:
1. AuthProvider component wrapping app
2. useAuth hook for consuming context
3. State management with actions: LOGIN, LOGOUT, LOADING, ERROR
4. Automatic token refresh handling
5. Session persistence across browser refreshes

AuthProvider should provide:
- login(email, password, rememberMe) function
- logout() function  
- checkAuthStatus() function
- User data and authentication state
- Loading and error states

State persistence:
- Check for existing tokens on app load
- Validate tokens and refresh if needed
- Handle automatic logout on token expiry
- Clear state on logout

Use TypeScript with proper typing for context value.
Follow React context patterns from project guidelines.
```

## Frontend Task F4: Login Form Component  
Copy this prompt:
```
Create login form component with validation and error handling.

Create file: frontend/src/components/auth/LoginForm.tsx

Component features:
1. Email input with validation (required, email format)
2. Password input with visibility toggle
3. Remember me checkbox
4. Loading state during submission
5. Error message display
6. Form validation before submission
7. Responsive design with Tailwind CSS

Validation rules:
- Email: required, valid format, max 255 chars
- Password: required, min 1 char (backend validates strength)
- Client-side validation before API call
- Display field-specific and general errors

State management:
- Form data state with proper typing
- Loading state for submit button
- Error state for validation and API errors
- Success handling with redirect

Design:
- Modern, clean design with Tailwind CSS
- Accessible form labels and ARIA attributes
- Responsive layout for mobile/desktop
- Focus states and keyboard navigation
- Loading spinner and disabled states

Use React functional component with hooks. Follow component patterns from project context.
```

## Frontend Task F5: User Navigation Component
Copy this prompt:
```
Create user navigation component for header login/logout functionality.

Create file: frontend/src/components/auth/UserNavigation.tsx

Component features:
1. Show login button when not authenticated
2. Show user dropdown menu when authenticated
3. User avatar with initials or profile image
4. Dropdown with user name, email, and logout option
5. Responsive design for mobile/desktop
6. Logout confirmation dialog

Authenticated state shows:
- User's first name and last name
- Email address
- Profile avatar (initials fallback)
- Logout button with confirmation
- Link to profile/account settings

Unauthenticated state shows:
- Login button linking to /login
- Optional signup link

Implementation:
- Use useAuth hook for authentication state
- Handle logout with loading state
- Proper accessibility (ARIA labels, keyboard nav)
- Mobile-friendly dropdown behavior
- Tailwind CSS styling

Follow component patterns from project context. Handle loading states gracefully.
```

## Frontend Task F6: Protected Route Component
Copy this prompt:
```
Create protected route wrapper component for authentication-required pages.

Create file: frontend/src/components/auth/ProtectedRoute.tsx

Component functionality:
1. Check authentication status before rendering children
2. Redirect to login if not authenticated
3. Show loading spinner during auth check
4. Preserve intended destination for post-login redirect
5. Handle token refresh attempts

Implementation details:
- Use useAuth hook to check authentication
- Use Next.js router for redirects
- Store return URL in query params or localStorage
- Handle edge cases (token expiry, network errors)
- Graceful loading states

Props interface:
- children: React.ReactNode
- redirectTo?: string (default: '/login')
- fallback?: React.ComponentType (custom loading component)

Usage pattern:
```tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

Handle authentication state changes (user logs out while on protected page).
Use proper TypeScript typing and follow Next.js routing patterns.
```

## Frontend Task F7: Authentication Routes
Copy this prompt:
```
Add authentication routes to Next.js application.

Create/update files:
1. frontend/src/app/login/page.tsx - Login page
2. frontend/src/app/dashboard/page.tsx - Example protected page
3. Update app layout for navigation

Login page should:
- Use LoginForm component
- Handle redirect after successful login
- Show loading states appropriately
- Have proper meta tags and title

Dashboard page should:
- Be wrapped with ProtectedRoute
- Show current user information
- Have logout functionality
- Demonstrate protected content

Layout updates:
- Add UserNavigation to header
- Wrap app with AuthProvider
- Handle route-based authentication

Routing considerations:
- Redirect logged-in users away from /login
- Preserve return URLs for post-login redirects
- Handle browser back/forward navigation
- Proper Next.js metadata and SEO

Follow Next.js 14 app directory patterns from project context.
```

## Integration Task I1: Connect API Service
Copy this prompt:
```
Connect frontend API service to real backend endpoints.

Update file: frontend/src/services/auth.service.ts

Prerequisites: Backend server running on http://localhost:5000

Changes needed:
1. Replace mock implementations with real fetch calls
2. Update base URL to actual backend (http://localhost:5000/api/v1/auth)
3. Ensure credentials: 'include' for cookie handling
4. Add proper error handling for all HTTP status codes
5. Test with actual running backend

API endpoints to connect:
- POST /login → backend auth controller login
- POST /logout → backend auth controller logout
- GET /me → backend auth controller getCurrentUser
- POST /refresh → backend auth controller refreshToken
- POST /verify-token → backend auth controller verifyToken

Error handling for:
- Network errors (backend down)
- 400 validation errors
- 401 authentication errors
- 429 rate limiting
- 500 server errors

Test each endpoint with network dev tools to verify requests/responses match API spec.
```

## Integration Task I2: Connect Authentication Context
Copy this prompt:
```
Wire up authentication context with real authentication flow.

Update file: frontend/src/contexts/auth.context.tsx

Prerequisites: API service connected to real backend

Integration points:
1. Replace mock auth calls with real API service calls
2. Implement automatic token refresh logic
3. Handle session persistence across browser refreshes
4. Manage authentication state properly on app load

Token refresh implementation:
- Monitor access token expiry
- Automatically refresh before expiration
- Handle refresh failures gracefully
- Maintain user session without interruption

Session persistence:
- Check authentication on app initialization
- Validate existing tokens with backend
- Handle expired/invalid tokens appropriately
- Clear state on authentication errors

State management:
- Update loading states during API calls
- Handle all error scenarios from API
- Maintain user data in sync with backend
- Clear sensitive data on logout

Test complete authentication flow: login → protected routes → automatic refresh → logout.
```

## Integration Task I6: End-to-End Testing
Copy this prompt:
```
Perform comprehensive testing of complete authentication system.

Test scenarios to verify:

1. Complete Login Flow:
   - Enter valid credentials → successful login
   - Enter invalid email → validation error
   - Enter wrong password → authentication error
   - Check remember me → extended session
   - Login redirects to intended page

2. Session Management:
   - Access tokens refresh automatically
   - Sessions persist across browser refresh
   - Sessions expire after appropriate time
   - Logout clears all tokens and state

3. Protected Routes:
   - Unauthenticated users redirected to login
   - Authenticated users can access protected content
   - Token expiry redirects to login gracefully
   - Return URLs work after login

4. Error Scenarios:
   - Backend server down → proper error messages
   - Network timeouts → retry mechanisms
   - Rate limiting → appropriate user feedback
   - Account lockout → clear messaging

5. UI/UX Testing:
   - All loading states display correctly
   - Error messages are user-friendly
   - Mobile responsive design works
   - Keyboard navigation functions
   - ARIA labels for accessibility

Testing tools:
- Manual testing in browser
- Network tab to verify API calls
- Browser dev tools for debugging
- Test multiple browsers and devices

Document any issues found and resolution steps.
```
