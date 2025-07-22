# User Login & User Logout Feature Specification

## Feature Overview
Enable users to authenticate with email/password credentials, maintain secure sessions, and logout securely. This feature handles both regular user authentication and provides foundation for hotel booking access control.

## VikBooking Analysis
**Files Analyzed:**
- `libraries/adapter/application/application.php` - Core login/logout functions with credential validation
- `libraries/adapter/user/user.php` - User data access with user_login field
- `site/helpers/operator.php` - Operator authentication via authentication codes
- `admin/views/config/tmpl/default_one.php` - Configuration for login requirements

**Key Functions Found:**
- `login($credentials, $options)` - Main authentication with username/password
- `logout($uid)` - Session destruction
- `authOperator($code)` - Alternative operator authentication
- User data access via user_login, user_email, display_name fields

## User Stories

### As a Guest User:
- I want to log in with my email and password so I can access my booking history
- I want the option to "remember me" so I don't have to login frequently
- I want to receive clear error messages when login fails
- I want to be redirected to my intended destination after successful login

### As a Logged-in User:
- I want to log out securely so my session is terminated
- I want to be redirected to the home page after logout
- I want my session to be secure and automatically expire after inactivity

### As a System:
- I want to validate credentials securely against the database
- I want to maintain user sessions with JWT tokens
- I want to log authentication events for security monitoring
- I want to prevent brute force attacks

## Business Rules

### Login Validation:
1. **Email Format**: Must be valid email address format
2. **Password Required**: Password cannot be empty
3. **Account Status**: Account must be verified (email_verified = true)
4. **Account Active**: Account must not be suspended or deleted
5. **Rate Limiting**: Max 5 login attempts per 15 minutes per IP
6. **Remember Me**: Optional, extends session to 30 days

### Session Management:
1. **JWT Tokens**: Access token (15 min), Refresh token (7 days)
2. **HttpOnly Cookies**: Secure cookie storage for tokens
3. **Session Storage**: Store user ID, role, permissions in JWT payload
4. **Auto Logout**: After 15 minutes of inactivity (access token expiry)

### Logout Process:
1. **Token Invalidation**: Add tokens to blacklist
2. **Cookie Clearing**: Remove all authentication cookies
3. **Session Cleanup**: Clear any server-side session data
4. **Redirect**: Return to home page or specified redirect

### Security Rules:
1. **Password Hashing**: Use bcrypt with minimum 12 rounds
2. **CSRF Protection**: Include CSRF token in login forms
3. **HTTPS Only**: All authentication must use HTTPS
4. **Audit Logging**: Log all login/logout events with IP, timestamp

## Database Schema

### Enhanced User Collection (`users`):
```javascript
{
  _id: ObjectId,
  email: String, // unique, required, indexed
  username: String, // unique, optional for display
  password: String, // bcrypt hashed
  firstName: String,
  lastName: String,
  phone: String,
  role: String, // enum: ['guest', 'user', 'admin']
  emailVerified: Boolean, // default: false
  isActive: Boolean, // default: true
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // Security fields
  failedLoginAttempts: Number, // default: 0
  accountLockedUntil: Date, // null if not locked
  passwordResetToken: String,
  passwordResetExpires: Date
}
```

### User Sessions Collection (`user_sessions`):
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: users
  refreshToken: String, // hashed
  deviceInfo: String, // user agent
  ipAddress: String,
  isActive: Boolean, // default: true
  expiresAt: Date, // 7 days from creation
  createdAt: Date,
  updatedAt: Date
}
```

### Blacklisted Tokens Collection (`blacklisted_tokens`):
```javascript
{
  _id: ObjectId,
  token: String, // hashed JWT token
  expiresAt: Date, // original token expiry
  createdAt: Date
}
```

## API Endpoints

### Authentication Endpoints:
1. `POST /api/v1/auth/login` - User login
2. `POST /api/v1/auth/logout` - User logout  
3. `POST /api/v1/auth/refresh` - Refresh access token
4. `GET /api/v1/auth/me` - Get current user info
5. `POST /api/v1/auth/verify-token` - Verify token validity

## UI Components

### Login Components:
1. **LoginForm.tsx** - Main login form with email/password fields
2. **RememberMeCheckbox.tsx** - Optional remember me functionality
3. **LoginButton.tsx** - Submit button with loading states
4. **ForgotPasswordLink.tsx** - Link to password reset

### Navigation Components:
1. **AuthNavigation.tsx** - Login/Logout buttons in header
2. **UserDropdown.tsx** - User menu with logout option
3. **ProtectedRoute.tsx** - Route wrapper requiring authentication

### Status Components:
1. **LoginStatus.tsx** - Show current authentication state
2. **LoadingSpinner.tsx** - Loading states during auth operations
3. **ErrorMessage.tsx** - Display authentication errors

## Security Considerations

### Authentication Flow:
1. User submits email/password
2. Server validates credentials
3. Server generates JWT access token (15min) and refresh token (7 days)
4. Tokens stored in httpOnly cookies
5. Client receives success response with user data
6. Subsequent requests include access token for authorization

### Logout Flow:
1. Client sends logout request
2. Server adds tokens to blacklist
3. Server clears authentication cookies
4. Client redirects to home page
5. Any pending requests with old tokens are rejected

### Token Refresh Flow:
1. Access token expires after 15 minutes
2. Client automatically attempts refresh using refresh token
3. If refresh token valid, new access token issued
4. If refresh token expired, user must login again
