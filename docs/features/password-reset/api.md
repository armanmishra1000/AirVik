# Password Reset API Documentation

## Overview
This document details all API endpoints for the password reset feature. All endpoints follow our standard response format and include comprehensive error handling.

---

### POST /api/v1/auth/password-reset/request
**Purpose**: Request a password reset token to be sent via email
**Auth Required**: No
**Request Body**:
```json
{
  "email": "string - user's email address"
}
```

**Validation:**
- email: required, valid email format, must exist in database

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password reset instructions have been sent to your email",
    "resetId": "507f1f77bcf86cd799439011",
    "expiresAt": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses:**
- **400**: Validation error
  ```json
  {
    "success": false,
    "error": "Invalid email format",
    "code": "VALIDATION_ERROR"
  }
  ```
- **404**: Email not found
  ```json
  {
    "success": false,
    "error": "No account found with this email address",
    "code": "EMAIL_NOT_FOUND"
  }
  ```
- **429**: Rate limit exceeded
  ```json
  {
    "success": false,
    "error": "Too many reset requests. Please wait 1 hour before trying again",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 3600
  }
  ```
- **423**: Account locked
  ```json
  {
    "success": false,
    "error": "Account is locked due to suspicious activity",
    "code": "ACCOUNT_LOCKED"
  }
  ```

---

### GET /api/v1/auth/password-reset/verify
**Purpose**: Verify if a password reset token is valid and not expired
**Auth Required**: No
**Query Parameters**:
- `token` (required): The password reset token from email
- `email` (required): The email address associated with the reset

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "user@example.com",
    "expiresAt": "2024-01-15T14:30:00Z",
    "expiresIn": 1800
  }
}
```

**Error Responses:**
- **400**: Missing parameters
  ```json
  {
    "success": false,
    "error": "Token and email are required",
    "code": "MISSING_PARAMETERS"
  }
  ```
- **404**: Invalid token
  ```json
  {
    "success": false,
    "error": "Invalid or expired reset token",
    "code": "INVALID_TOKEN"
  }
  ```
- **410**: Token expired
  ```json
  {
    "success": false,
    "error": "Reset token has expired. Please request a new password reset",
    "code": "TOKEN_EXPIRED"
  }
  ```
- **409**: Token already used
  ```json
  {
    "success": false,
    "error": "This reset token has already been used",
    "code": "TOKEN_ALREADY_USED"
  }
  ```

---

### POST /api/v1/auth/password-reset/confirm
**Purpose**: Complete the password reset process with new password
**Auth Required**: No
**Request Body**:
```json
{
  "token": "string - password reset token",
  "email": "string - user's email address",
  "newPassword": "string - new password",
  "confirmPassword": "string - password confirmation"
}
```

**Validation:**
- token: required, valid format
- email: required, valid email format
- newPassword: required, min 8 chars, must contain uppercase, lowercase, number
- confirmPassword: required, must match newPassword

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password has been successfully reset",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "def502001a9f2c8e4b1234567890abcdef...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- **400**: Validation error
  ```json
  {
    "success": false,
    "error": "Password must contain at least one uppercase letter",
    "code": "PASSWORD_POLICY_VIOLATION"
  }
  ```
- **400**: Password mismatch
  ```json
  {
    "success": false,
    "error": "Passwords do not match",
    "code": "PASSWORD_MISMATCH"
  }
  ```
- **404**: Invalid token
  ```json
  {
    "success": false,
    "error": "Invalid or expired reset token",
    "code": "INVALID_TOKEN"
  }
  ```
- **410**: Token expired
  ```json
  {
    "success": false,
    "error": "Reset token has expired",
    "code": "TOKEN_EXPIRED"
  }
  ```
- **409**: Token already used
  ```json
  {
    "success": false,
    "error": "This reset token has already been used",
    "code": "TOKEN_ALREADY_USED"
  }
  ```

---

### GET /api/v1/auth/password-reset/status
**Purpose**: Check the status of recent password reset requests for monitoring
**Auth Required**: Yes (Admin only)
**Query Parameters**:
- `email` (optional): Filter by email address
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "email": "user@example.com",
      "action": "SUCCESS",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "requestedAt": "2024-01-15T13:30:00Z",
      "completedAt": "2024-01-15T13:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Error Responses:**
- **401**: Not authenticated
  ```json
  {
    "success": false,
    "error": "Authentication required",
    "code": "UNAUTHORIZED"
  }
  ```
- **403**: Insufficient permissions
  ```json
  {
    "success": false,
    "error": "Admin access required",
    "code": "FORBIDDEN"
  }
  ```
- **400**: Invalid parameters
  ```json
  {
    "success": false,
    "error": "Invalid date format",
    "code": "VALIDATION_ERROR"
  }
  ```

## Rate Limiting

All password reset endpoints implement rate limiting:

### Request Endpoint (`/request`)
- **Per Email**: 3 requests per hour
- **Per IP**: 10 requests per hour
- **Global**: 1000 requests per hour

### Verify Endpoint (`/verify`)
- **Per IP**: 60 requests per minute
- **Per Token**: 10 requests per minute

### Confirm Endpoint (`/confirm`)
- **Per Token**: 3 attempts per token lifetime
- **Per IP**: 20 requests per hour

## Security Headers

All endpoints return these security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| VALIDATION_ERROR | Request validation failed | 400 |
| EMAIL_NOT_FOUND | Email address not in system | 404 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |
| ACCOUNT_LOCKED | Account locked due to security | 423 |
| MISSING_PARAMETERS | Required parameters missing | 400 |
| INVALID_TOKEN | Token is invalid or malformed | 404 |
| TOKEN_EXPIRED | Token has passed expiration | 410 |
| TOKEN_ALREADY_USED | Token was already consumed | 409 |
| PASSWORD_POLICY_VIOLATION | Password doesn't meet requirements | 400 |
| PASSWORD_MISMATCH | Passwords don't match | 400 |
| UNAUTHORIZED | Authentication required | 401 |
| FORBIDDEN | Insufficient permissions | 403 |

## Response Time SLAs

- **Request endpoint**: < 500ms (including email sending)
- **Verify endpoint**: < 100ms
- **Confirm endpoint**: < 300ms (including DB updates)
- **Status endpoint**: < 200ms

## Testing

Use these test scenarios:

1. **Happy Path**: Request → Verify → Confirm
2. **Token Expiration**: Wait 1 hour then try to use token
3. **Rate Limiting**: Make 4+ requests in 1 hour
4. **Invalid Email**: Use non-existent email
5. **Password Policy**: Try weak passwords
6. **Double Usage**: Use same token twice
