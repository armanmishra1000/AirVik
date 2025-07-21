# User Registration with Email Verification - API Documentation

## Authentication Endpoints

### POST /api/v1/auth/register
**Purpose**: Register a new user account and send email verification
**Auth Required**: No

**Request Body**:
```json
{
  "email": "string - user's email address",
  "password": "string - user's password (min 8 chars)",
  "firstName": "string - user's first name",
  "lastName": "string - user's last name",
  "phoneNumber": "string - user's phone number (optional)"
}
```

**Validation**:
- email: required, valid email format, unique in system
- password: required, minimum 8 characters, must contain uppercase, lowercase, number
- firstName: required, 2-50 characters, alphabetic only
- lastName: required, 2-50 characters, alphabetic only
- phoneNumber: optional, valid phone format if provided

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification instructions.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "status": "unverified"
  }
}
```

**Error Responses**:
- 400: Validation error
- 409: Email already registered
- 429: Too many registration attempts
- 500: Server error

**Example Error Response (400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email address is already registered"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

---

### POST /api/v1/auth/verify-email
**Purpose**: Verify user's email address using verification token
**Auth Required**: No

**Request Body**:
```json
{
  "token": "string - email verification token from email"
}
```

**Validation**:
- token: required, valid UUID format

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "status": "verified"
  }
}
```

**Error Responses**:
- 400: Invalid or missing token
- 404: Token not found or expired
- 410: Token already used
- 500: Server error

---

### GET /api/v1/auth/verify-email/:token
**Purpose**: Verify email via URL link (browser redirect endpoint)
**Auth Required**: No

**URL Parameters**:
- token: Email verification token

**Success Response (302)**:
- Redirects to: `/auth/verify-success?verified=true`

**Error Responses**:
- 302: Redirects to `/auth/verify-error?error=invalid_token`
- 302: Redirects to `/auth/verify-error?error=expired_token`
- 302: Redirects to `/auth/verify-error?error=already_used`

---

### POST /api/v1/auth/resend-verification
**Purpose**: Resend email verification to unverified user
**Auth Required**: No

**Request Body**:
```json
{
  "email": "string - user's email address"
}
```

**Validation**:
- email: required, valid email format, must exist in system

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Verification email sent successfully. Please check your inbox.",
  "data": {
    "email": "user@example.com",
    "tokenExpiresAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400: Invalid email format
- 404: Email not found
- 409: User already verified
- 429: Too many resend requests
- 500: Server error

**Example Error Response (429)**:
```json
{
  "success": false,
  "message": "Too many verification email requests. Please wait before requesting again.",
  "data": {
    "remainingTime": 1800,
    "maxRequestsPerHour": 3,
    "currentRequestCount": 3
  }
}
```

---

## User Management Endpoints

### GET /api/v1/users/profile
**Purpose**: Get current user's profile information
**Auth Required**: Yes (Bearer token)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "status": "verified",
    "createdAt": "2024-01-10T08:15:30Z",
    "lastLoginAt": "2024-01-14T14:22:10Z"
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 404: User not found
- 500: Server error

---

### PUT /api/v1/users/profile
**Purpose**: Update current user's profile information
**Auth Required**: Yes (Bearer token)

**Request Body**:
```json
{
  "firstName": "string - updated first name",
  "lastName": "string - updated last name", 
  "phoneNumber": "string - updated phone number (optional)"
}
```

**Validation**:
- firstName: required, 2-50 characters, alphabetic only
- lastName: required, 2-50 characters, alphabetic only
- phoneNumber: optional, valid phone format if provided

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "phoneNumber": "+1234567890",
    "status": "verified",
    "updatedAt": "2024-01-15T09:30:45Z"
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Not authenticated
- 404: User not found
- 500: Server error

---

## Admin Endpoints

### GET /api/v1/admin/users
**Purpose**: Get list of all users with pagination and filtering
**Auth Required**: Yes (Admin role)

**Query Parameters**:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- status: string (unverified|verified|suspended)
- search: string (search in email, firstName, lastName)
- sortBy: string (createdAt|email|lastName)
- sortOrder: string (asc|desc, default: desc)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "verified",
        "createdAt": "2024-01-10T08:15:30Z",
        "lastLoginAt": "2024-01-14T14:22:10Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 98,
      "limit": 20
    }
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Insufficient permissions
- 400: Invalid query parameters
- 500: Server error

---

### PUT /api/v1/admin/users/:userId/status
**Purpose**: Update user account status (suspend/unsuspend/verify)
**Auth Required**: Yes (Admin role)

**URL Parameters**:
- userId: User ID to update

**Request Body**:
```json
{
  "status": "string - verified|suspended",
  "reason": "string - reason for status change (required for suspension)"
}
```

**Validation**:
- status: required, must be 'verified' or 'suspended'
- reason: required if status is 'suspended', 10-200 characters

**Success Response (200)**:
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "previousStatus": "verified",
    "newStatus": "suspended",
    "reason": "Violation of terms of service",
    "updatedAt": "2024-01-15T11:45:20Z"
  }
}
```

**Error Responses**:
- 400: Invalid status or missing reason
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found
- 500: Server error

---

## Common Error Response Format

All endpoints follow this error response structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE_IDENTIFIER",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ],
  "timestamp": "2024-01-15T12:00:00Z",
  "requestId": "req-12345-67890"
}
```

## Rate Limiting

- Registration: 3 attempts per IP per hour
- Verification email resend: 3 attempts per email per hour
- Login attempts: 5 attempts per IP per 15 minutes
- Password reset: 3 attempts per email per hour

## Authentication

- Use Bearer token authentication for protected endpoints
- Tokens expire after 24 hours
- Refresh tokens valid for 30 days
- Include `Authorization: Bearer <token>` in request headers
