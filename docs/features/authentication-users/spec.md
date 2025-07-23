# Authentication & Users Feature Specification

## Feature Overview
The Authentication & Users feature provides comprehensive user management functionality including registration, email verification, login/logout, password reset, JWT token refresh, role assignment, and permission checking. This system enables secure access control for the hotel booking management system with multiple user roles (Guest, Customer, Manager, Admin).

## VikBookging Analysis
Based on analysis of the VikBooking system, the following relevant files and patterns were identified:

### VikBooking Files Analyzed:
- **libraries/adapter/user/user.php**: WordPress user wrapper class with methods for user management, authentication state, and profile data access
- **site/views/loginregister/view.html.php**: View controller for login/registration pages with room booking context preservation
- **admin/resources/customers/**: Customer management functionality
- **admin/layouts/customer/**: Customer data display layouts
- **admin/views/exportcustomers/**: Customer data export functionality

### Key Business Logic Patterns:
- User authentication state management through WordPress integration
- Session persistence across booking flow
- Customer data collection during booking process
- Role-based access control for admin functions
- Integration with booking context (room selection, dates, pricing)

## Existing Files Analysis
The following existing files will be used/modified by this feature:

### Backend Files (Existing):
- `backend/src/controllers/auth.controller.ts`: Auth request handlers - needs completion
- `backend/src/services/auth.service.ts`: Auth business logic - needs enhancement  
- `backend/src/models/user.model.ts`: User MongoDB schema - needs review
- `backend/src/routes/auth.routes.ts`: Auth API routes - needs validation
- `backend/src/services/email.service.ts`: Email functionality - needs integration

### Frontend Files (Existing):
- `frontend/src/contexts/AuthContext.tsx`: Global auth state management
- `frontend/src/services/auth.service.ts`: API communication layer
- `frontend/src/types/auth.types.ts`: TypeScript type definitions
- `frontend/src/components/auth/`: Authentication UI components
- `frontend/src/utils/validation.ts`: Input validation utilities

### Files to Create:
- JWT middleware for token validation
- Permission checking middleware  
- Role management endpoints
- Admin user management interface
- Password strength validation
- Rate limiting for auth endpoints

## User Stories

### Guest Users (Unauthenticated)
- As a guest, I can register for a new account with email verification
- As a guest, I can log in with email and password
- As a guest, I can request password reset via email
- As a guest, I can view public pages without authentication

### Registered Customers
- As a customer, I can log out from my account
- As a customer, I can update my profile information
- As a customer, I can change my password
- As a customer, I can view my booking history
- As a customer, I can delete my account

### Hotel Managers
- As a manager, I can view customer lists
- As a manager, I can manage room availability
- As a manager, I can process bookings
- As a manager, I cannot access admin-only features

### System Administrators  
- As an admin, I can assign roles to users
- As an admin, I can manage all user accounts
- As an admin, I can view system logs
- As an admin, I can access all system features

## Business Rules

### Registration Rules:
- Email must be unique in the system
- Password must meet strength requirements (8+ chars, mixed case, numbers)
- Email verification required before account activation
- Verification links expire after 24 hours
- Default role is "customer" for self-registrations

### Authentication Rules:
- JWT access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Maximum 5 login attempts before account lockout (15 minutes)
- Tokens stored in httpOnly cookies for security
- Session invalidation on password change

### Authorization Rules:
- Route-based permissions checked via middleware
- Role hierarchy: Guest < Customer < Manager < Admin
- Resource-based permissions (own bookings vs all bookings)
- API endpoints require appropriate role level

### Security Rules:
- All passwords hashed with bcrypt (12+ rounds)
- Email verification tokens are cryptographically secure
- Password reset tokens expire after 1 hour
- Rate limiting on sensitive endpoints
- CSRF protection on state-changing operations

## Database Schema

### Users Collection (`users`)
```javascript
{
  _id: ObjectId,
  email: String (unique, required, lowercase),
  password: String (required, hashed),
  firstName: String (required),
  lastName: String (required),
  phone: String (optional),
  dateOfBirth: Date (optional),
  role: String (enum: ['guest', 'customer', 'manager', 'admin'], default: 'customer'),
  isEmailVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  lastLoginAt: Date,
  loginAttempts: Number (default: 0),
  lockoutUntil: Date,
  profileImage: String (optional),
  preferences: {
    newsletter: Boolean (default: false),
    notifications: Boolean (default: true),
    language: String (default: 'en')
  },
  metadata: {
    registrationIP: String,
    userAgent: String,
    source: String (enum: ['web', 'mobile', 'admin'])
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Email Verification Tokens Collection (`email_verification_tokens`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  token: String (unique, required),
  type: String (enum: ['email_verification', 'password_reset']),
  expiresAt: Date (required),
  usedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Refresh Tokens Collection (`refresh_tokens`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  token: String (unique, required),
  expiresAt: Date (required),
  isRevoked: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication Endpoints:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/verify-email` - Email verification  
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT tokens
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation

### User Management Endpoints:
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/password` - Change password
- `DELETE /api/v1/users/account` - Delete user account
- `GET /api/v1/users` - List users (admin/manager only)
- `PUT /api/v1/users/:id/role` - Update user role (admin only)
- `PUT /api/v1/users/:id/status` - Activate/deactivate user (admin only)

## UI Components

### Authentication Pages:
- `LoginForm.tsx` - Email/password login form
- `RegisterForm.tsx` - User registration form  
- `EmailVerification.tsx` - Email verification status page
- `ForgotPasswordForm.tsx` - Password reset request form
- `ResetPasswordForm.tsx` - New password confirmation form

### User Management Pages:
- `UserProfile.tsx` - User profile display/edit
- `UsersList.tsx` - Admin user management interface
- `RoleManagement.tsx` - Role assignment interface

### Utility Components:
- `RouteGuard.tsx` - Protected route wrapper
- `RoleGuard.tsx` - Role-based access wrapper
- `AuthStatus.tsx` - Authentication status indicator

## Shared Dependencies

### Existing Files to Reuse:
- `frontend/src/contexts/AuthContext.tsx` - Global state management
- `frontend/src/services/auth.service.ts` - API service functions
- `frontend/src/types/auth.types.ts` - TypeScript interfaces
- `frontend/src/utils/validation.ts` - Form validation utilities
- `backend/src/services/email.service.ts` - Email sending functionality

### Dependencies NOT to Recreate:
- Authentication context and providers
- Basic API service structure  
- Type definitions for auth data
- Email service infrastructure
- Validation utility functions

The feature will enhance and complete existing infrastructure rather than replacing it.
