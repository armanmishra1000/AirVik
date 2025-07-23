# Authentication & Users API Documentation

## Authentication Endpoints

### POST /api/v1/auth/register
**Purpose**: Register a new user account with email verification
**Auth Required**: No

**Request Body**:
```json
{
  "email": "string - user's email address",
  "password": "string - user's password (8+ characters)",
  "firstName": "string - user's first name",
  "lastName": "string - user's last name",
  "phone": "string - user's phone number (optional)",
  "dateOfBirth": "string - ISO date format (optional)",
  "preferences": {
    "newsletter": "boolean - subscribe to newsletter (optional, default: false)",
    "notifications": "boolean - receive notifications (optional, default: true)"
  }
}
```

**Validation**:
- email: required, valid email format, unique
- password: required, min 8 characters, must contain uppercase, lowercase, number
- firstName: required, min 2 characters, max 50 characters
- lastName: required, min 2 characters, max 50 characters
- phone: optional, valid phone number format
- dateOfBirth: optional, valid date, user must be 13+ years old

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isEmailVerified": false,
      "isActive": true
    },
    "message": "Registration successful. Please check your email for verification."
  }
}
```

**Error Responses**:
- 400: Validation error, email already exists
- 429: Too many registration attempts
- 500: Server error

---

### POST /api/v1/auth/verify-email
**Purpose**: Verify user email address using verification token
**Auth Required**: No

**Request Body**:
```json
{
  "token": "string - email verification token from email"
}
```

**Validation**:
- token: required, valid format

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

**Error Responses**:
- 400: Invalid or expired token
- 404: Token not found
- 410: Token already used

---

### POST /api/v1/auth/resend-verification
**Purpose**: Resend email verification link
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
  "data": {
    "message": "Verification email sent successfully"
  }
}
```

**Error Responses**:
- 400: Email already verified, invalid email
- 404: Email not found
- 429: Too many resend attempts

---

### POST /api/v1/auth/login
**Purpose**: Authenticate user and return JWT tokens
**Auth Required**: No

**Request Body**:
```json
{
  "email": "string - user's email address",
  "password": "string - user's password"
}
```

**Validation**:
- email: required, valid email format
- password: required

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isEmailVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "507f1f77bcf86cd799439012",
      "expiresAt": "2024-01-15T10:45:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Invalid credentials
- 401: Email not verified, account locked
- 429: Too many login attempts

---

### POST /api/v1/auth/logout
**Purpose**: Log out user and invalidate tokens
**Auth Required**: Yes (Bearer token)

**Request Body**: None

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Error Responses**:
- 401: Not authenticated

---

### POST /api/v1/auth/refresh
**Purpose**: Refresh JWT access token using refresh token
**Auth Required**: No (uses refresh token)

**Request Body**:
```json
{
  "refreshToken": "string - valid refresh token"
}
```

**Validation**:
- refreshToken: required, valid format, not expired

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "507f1f77bcf86cd799439013",
      "expiresAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Invalid or expired refresh token
- 401: Token revoked

---

### POST /api/v1/auth/forgot-password
**Purpose**: Request password reset link via email
**Auth Required**: No

**Request Body**:
```json
{
  "email": "string - user's email address"
}
```

**Validation**:
- email: required, valid email format

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent if account exists"
  }
}
```

**Error Responses**:
- 429: Too many reset attempts

---

### POST /api/v1/auth/reset-password
**Purpose**: Reset password using reset token
**Auth Required**: No

**Request Body**:
```json
{
  "token": "string - password reset token from email",
  "newPassword": "string - new password (8+ characters)"
}
```

**Validation**:
- token: required, valid format
- newPassword: required, min 8 characters, must contain uppercase, lowercase, number

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Responses**:
- 400: Invalid or expired token, weak password
- 404: Token not found

---

## User Management Endpoints

### GET /api/v1/users/profile
**Purpose**: Get current user's profile information
**Auth Required**: Yes (customer, manager, admin)

**Request Body**: None

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-15",
      "role": "customer",
      "isEmailVerified": true,
      "profileImage": "https://example.com/avatar.jpg",
      "preferences": {
        "newsletter": false,
        "notifications": true,
        "language": "en"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Responses**:
- 401: Not authenticated

---

### PUT /api/v1/users/profile
**Purpose**: Update current user's profile information
**Auth Required**: Yes (customer, manager, admin)

**Request Body**:
```json
{
  "firstName": "string - updated first name (optional)",
  "lastName": "string - updated last name (optional)",
  "phone": "string - updated phone number (optional)",
  "dateOfBirth": "string - updated date of birth (optional)",
  "preferences": {
    "newsletter": "boolean - newsletter subscription (optional)",
    "notifications": "boolean - notifications preference (optional)",
    "language": "string - preferred language (optional)"
  }
}
```

**Validation**:
- firstName: optional, min 2 characters, max 50 characters
- lastName: optional, min 2 characters, max 50 characters
- phone: optional, valid phone number format
- dateOfBirth: optional, valid date, user must be 13+ years old

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-15",
      "role": "customer",
      "preferences": {
        "newsletter": true,
        "notifications": true,
        "language": "en"
      },
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Not authenticated

---

### PUT /api/v1/users/password
**Purpose**: Change current user's password
**Auth Required**: Yes (customer, manager, admin)

**Request Body**:
```json
{
  "currentPassword": "string - current password for verification",
  "newPassword": "string - new password (8+ characters)"
}
```

**Validation**:
- currentPassword: required, must match existing password
- newPassword: required, min 8 characters, must contain uppercase, lowercase, number, different from current

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Responses**:
- 400: Current password incorrect, weak new password
- 401: Not authenticated

---

### DELETE /api/v1/users/account
**Purpose**: Delete current user's account (soft delete)
**Auth Required**: Yes (customer, manager, admin)

**Request Body**:
```json
{
  "password": "string - current password for confirmation"
}
```

**Validation**:
- password: required, must match existing password

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

**Error Responses**:
- 400: Password incorrect
- 401: Not authenticated

---

### GET /api/v1/users
**Purpose**: List all users with filtering and pagination
**Auth Required**: Yes (manager, admin)

**Query Parameters**:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- role: string (filter by role)
- isActive: boolean (filter by active status)
- search: string (search by name or email)

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isActive": true,
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Insufficient permissions

---

### PUT /api/v1/users/:id/role
**Purpose**: Update user role (admin only)
**Auth Required**: Yes (admin)

**Request Body**:
```json
{
  "role": "string - new role (customer, manager, admin)"
}
```

**Validation**:
- role: required, valid role value

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "manager",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Invalid role
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found

---

### PUT /api/v1/users/:id/status
**Purpose**: Activate or deactivate user account
**Auth Required**: Yes (admin)

**Request Body**:
```json
{
  "isActive": "boolean - account active status"
}
```

**Validation**:
- isActive: required, boolean value

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "isActive": false,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": {
    "field": "specific field that caused error (for validation)",
    "value": "invalid value provided"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Request data validation failed
- `AUTHENTICATION_REQUIRED`: Valid JWT token required
- `INSUFFICIENT_PERMISSIONS`: User role lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `DUPLICATE_RESOURCE`: Resource with unique constraint already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window
- `ACCOUNT_LOCKED`: User account is temporarily locked
- `EMAIL_NOT_VERIFIED`: Email verification required
- `TOKEN_EXPIRED`: JWT or other token has expired
- `TOKEN_INVALID`: Token format or signature invalid
