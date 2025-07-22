# Password Reset Feature Specification

## Feature Overview
The password reset feature allows users to securely reset their forgotten passwords through email verification. Users request a password reset, receive a secure token via email, and can set a new password within a time-limited window.

## VikBooking Analysis
**Files Found:**
- `/vikbooking/libraries/adapter/router/classes/users.php` (lines 33-38)

**Functions Found:**
- `build()` method that redirects password reset to WordPress `wp_lostpassword_url()`

**Business Logic Flow:**
VikBooking relies on WordPress's built-in password reset functionality rather than implementing its own. The system simply redirects users to WordPress's password reset page when they need to reset passwords.

**Database Operations:**
No custom database operations found for password reset. VikBooking uses WordPress's user management system.

**Validation Rules:**
No custom validation rules found. Relies on WordPress's validation.

**Note:** Since VikBooking delegates to WordPress, we need to implement a complete standalone password reset system for our MongoDB-based application.

## User Stories

### As a User (Customer/Guest)
- I can request a password reset by providing my email address
- I can receive a password reset email with a secure link
- I can click the link and be taken to a password reset form
- I can set a new password that meets security requirements
- I can see confirmation that my password was successfully reset
- I can be automatically logged in after successful password reset

### As a System
- I can generate secure, time-limited password reset tokens
- I can send password reset emails using templates
- I can validate reset tokens and ensure they haven't expired
- I can enforce password security policies during reset
- I can invalidate tokens after successful use
- I can track failed reset attempts for security monitoring

## Business Rules

### Password Reset Request
1. **Email Validation**: Must be a valid, registered email address
2. **Rate Limiting**: Max 3 reset requests per email per hour
3. **Account Status**: Only active (non-suspended) accounts can request resets
4. **Token Generation**: Generate cryptographically secure 32-byte token
5. **Email Delivery**: Send reset email within 30 seconds of request
6. **Previous Tokens**: Invalidate any existing reset tokens for the user

### Password Reset Token
1. **Expiration**: Tokens expire after 1 hour (3600 seconds)
2. **Single Use**: Tokens become invalid after successful password reset
3. **Security**: Tokens must be URL-safe and unpredictable
4. **Storage**: Store hashed version of token in database
5. **Validation**: Verify token format, existence, expiration, and usage status

### Password Reset Completion
1. **Password Policy**: Minimum 8 characters, must contain uppercase, lowercase, number
2. **Confirmation**: Must confirm password by typing twice
3. **Security**: Hash password using bcrypt with minimum 12 rounds
4. **Session Management**: Invalidate all existing user sessions
5. **Notification**: Send confirmation email after successful reset
6. **Auto Login**: Optionally log user in after successful reset

### Security Measures
1. **HTTPS Only**: All password reset operations require HTTPS
2. **CSRF Protection**: Include CSRF tokens in reset forms
3. **IP Tracking**: Log IP addresses for reset requests and completions
4. **Audit Trail**: Maintain logs of all password reset activities
5. **Suspicious Activity**: Lock account after 5 failed reset attempts in 24 hours

## Database Schema

### Users Collection (existing - modifications needed)
```javascript
{
  _id: ObjectId,
  email: String, // existing
  password: String, // existing - will be updated
  // ... other existing fields
  
  // New fields for password reset
  passwordResetToken: String, // hashed token
  passwordResetExpires: Date, // token expiration
  passwordResetRequestedAt: Date, // when reset was requested
  passwordResetIP: String, // IP address of reset request
  passwordResetAttempts: [{
    requestedAt: Date,
    ip: String,
    completed: Boolean,
    failureReason: String
  }],
  lastPasswordReset: Date, // when password was last reset
  
  createdAt: Date, // existing
  updatedAt: Date, // existing
}
```

### Password Reset Logs Collection (new)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // reference to User
  email: String, // user's email at time of reset
  action: String, // 'REQUEST', 'ATTEMPT', 'SUCCESS', 'FAILURE', 'EXPIRED'
  ip: String, // IP address
  userAgent: String, // browser info
  tokenHash: String, // hash of reset token (for matching)
  errorMessage: String, // if action failed
  requestedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes Needed:**
- Users: `{ email: 1, passwordResetToken: 1 }`
- Users: `{ passwordResetExpires: 1 }` (TTL index)
- Password Reset Logs: `{ userId: 1, requestedAt: -1 }`
- Password Reset Logs: `{ ip: 1, requestedAt: -1 }`

## API Endpoints

1. **POST /api/v1/auth/password-reset/request** - Request password reset
2. **GET /api/v1/auth/password-reset/verify** - Verify reset token
3. **POST /api/v1/auth/password-reset/confirm** - Complete password reset
4. **GET /api/v1/auth/password-reset/status** - Check reset request status

## UI Components

### Password Reset Request Page
- Email input field with validation
- Submit button with loading state
- Link back to login page
- Rate limiting messaging
- Success/error feedback

### Password Reset Form Page
- New password input with strength indicator
- Confirm password input
- Password requirements display
- Submit button with loading state
- Token expiration timer
- Error handling for invalid/expired tokens

### Email Templates
- Password reset request email (HTML + text)
- Password reset success confirmation email
- Account security notification email

### Success/Error Pages
- Password reset success page with login link
- Token expired page with option to request new reset
- Invalid token error page
- Account locked notification page

## Security Considerations

1. **Token Security**: Use crypto.randomBytes() for token generation
2. **Rate Limiting**: Implement per-IP and per-email rate limiting
3. **Email Security**: Validate email templates to prevent XSS
4. **HTTPS Enforcement**: All password operations over HTTPS only
5. **Audit Logging**: Comprehensive logging for security monitoring
6. **Token Storage**: Store only hashed tokens in database
7. **Session Invalidation**: Clear all sessions on password reset
8. **IP Validation**: Optional IP binding for reset tokens

## Integration Points

1. **Email Service**: SendGrid for transactional emails
2. **Authentication System**: JWT token generation after reset
3. **Logging System**: Security audit logs
4. **Rate Limiting**: Redis-based rate limiting
5. **Frontend Router**: Deep linking to reset form with token

## Acceptance Criteria

1. ✅ Users can request password reset with valid email
2. ✅ Reset emails are delivered within 30 seconds
3. ✅ Reset tokens expire after 1 hour
4. ✅ Users can successfully reset password with valid token
5. ✅ Invalid/expired tokens show appropriate error messages
6. ✅ Rate limiting prevents abuse (3 requests/hour per email)
7. ✅ All password reset activities are logged
8. ✅ New passwords meet security requirements
9. ✅ Users are optionally logged in after successful reset
10. ✅ Old sessions are invalidated on password reset
