# User Login & User Logout API Documentation

## Authentication Endpoints

### POST /api/v1/auth/login
**Purpose**: Authenticate user with email and password, create session tokens
**Auth Required**: No
**Request Body**:
```json
{
  "email": "string - user's email address",
  "password": "string - user's password",
  "rememberMe": "boolean - optional, extend session duration"
}
```

**Validation:**
- email: required, valid email format, max 255 characters
- password: required, min 1 character (will be validated against hash)
- rememberMe: optional boolean, defaults to false

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "message": "Login successful"
}
```

**Error Responses:**
- **400**: Validation error (invalid email format, missing password)
- **401**: Invalid credentials (wrong email or password)
- **401**: Account not verified (email not verified)
- **423**: Account locked (too many failed attempts)
- **429**: Rate limit exceeded (too many login attempts)
- **500**: Server error

### POST /api/v1/auth/logout
**Purpose**: Log out current user, invalidate session tokens
**Auth Required**: Yes (Bearer token)
**Request Body**: None (empty)

**Success Response (200):**
```json
{
  "success": true,
  "data": {},
  "message": "Logout successful"
}
```

**Error Responses:**
- **401**: Not authenticated (no token or invalid token)
- **500**: Server error

### POST /api/v1/auth/refresh
**Purpose**: Generate new access token using refresh token
**Auth Required**: No (uses refresh token from cookie)
**Request Body**: None (uses httpOnly cookie)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "message": "Token refreshed successfully"
}
```

**Error Responses:**
- **401**: Invalid refresh token (expired or not found)
- **401**: Refresh token blacklisted
- **400**: No refresh token provided
- **500**: Server error

### GET /api/v1/auth/me
**Purpose**: Get current authenticated user information
**Auth Required**: Yes (Bearer token)
**Request Body**: None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "phone": "+1234567890",
      "role": "user",
      "emailVerified": true,
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- **401**: Not authenticated (no token or invalid token)
- **401**: Token expired
- **404**: User not found (user deleted)
- **500**: Server error

### POST /api/v1/auth/verify-token
**Purpose**: Verify if current access token is valid
**Auth Required**: Yes (Bearer token)
**Request Body**: None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2024-01-15T10:45:00Z",
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

**Error Responses:**
- **401**: Invalid token (expired, malformed, or blacklisted)
- **400**: No token provided
- **500**: Server error

## Rate Limiting

### Login Rate Limiting
- **Per IP**: 10 requests per 15 minutes
- **Per Email**: 5 requests per 15 minutes
- **Response**: HTTP 429 with retry-after header

### General Auth Rate Limiting
- **Per IP**: 100 requests per 15 minutes for all auth endpoints
- **Per User**: 50 requests per 15 minutes for authenticated endpoints

## Cookie Configuration

### Access Token Cookie
- **Name**: `access_token`
- **HttpOnly**: true
- **Secure**: true (HTTPS only)
- **SameSite**: 'lax'
- **Max-Age**: 900 seconds (15 minutes)

### Refresh Token Cookie  
- **Name**: `refresh_token`
- **HttpOnly**: true
- **Secure**: true (HTTPS only)
- **SameSite**: 'lax'
- **Max-Age**: 604800 seconds (7 days, or 30 days if rememberMe)

## Error Response Format

All error responses follow this structure:
```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {} // optional, for validation errors
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `INVALID_CREDENTIALS` - Email or password incorrect
- `ACCOUNT_NOT_VERIFIED` - Email verification required
- `ACCOUNT_LOCKED` - Too many failed login attempts
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TOKEN_EXPIRED` - Access token expired
- `TOKEN_INVALID` - Token malformed or blacklisted
- `USER_NOT_FOUND` - User account deleted
- `SERVER_ERROR` - Internal server error

## Authentication Headers

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-CSRF-Token: csrf_token_value
```

### Response Headers
```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642234567
```

## Security Considerations

### Password Requirements (Frontend Validation)
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- At least 1 special character

### Token Security
- Access tokens are short-lived (15 minutes)
- Refresh tokens stored in httpOnly cookies
- Tokens blacklisted on logout
- CSRF protection for state-changing operations

### Account Security
- Account locked after 5 failed login attempts
- Lock duration increases with repeated failures (1min, 5min, 15min, 1hour)
- Password reset required after extended lockout
- Audit logging for all authentication events
