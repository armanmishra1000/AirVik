# User Registration with Email Verification - Feature Specification

## Feature Overview
This feature enables users to register for hotel booking accounts with email verification. Users create accounts with personal information, receive verification emails, and must verify their email addresses before booking capabilities are activated.

## VikBooking Analysis

### Files Found
- `/vikbooking/libraries/adapter/mvc/models/users/registration.php` - UsersModelRegistration class
- `/vikbooking/libraries/adapter/config/config.php` - users.allowUserRegistration setting

### Functions Found
- `UsersModelRegistration::register(array $data)` - Main registration function
- Creates new JUser instance, binds data, saves user, returns user ID or false
- Error handling via `$this->setError($user->getError())`

### Business Logic Flow
1. Create new empty JUser
2. Bind user data to user object
3. Save user to database
4. Return user ID on success, false on failure
5. Set error messages for failures

### Database Operations
- Uses Joomla's JUser model for user creation
- User data stored in standard Joomla users table structure

### Validation Rules
- Inherits basic JUser validation from Joomla framework
- Email format validation
- Required field validation

## User Stories

### Epic: User Registration
**As a** hotel guest  
**I want to** create an account with email verification  
**So that I can** book rooms and manage my reservations securely

#### Story 1: User Registration
**As a** new user  
**I want to** register with my email, password, and personal details  
**So that I can** access the hotel booking system

**Acceptance Criteria:**
- User can access registration form
- User provides: email, password, first name, last name, phone number
- System validates all required fields
- System checks email format is valid
- System checks password meets security requirements
- System checks email is not already registered
- System creates user account in "unverified" status
- System sends verification email
- System shows success message with verification instructions

#### Story 2: Email Verification
**As a** registered user  
**I want to** verify my email address  
**So that I can** activate my account and start booking

**Acceptance Criteria:**
- User receives verification email with unique token
- User clicks verification link in email
- System validates verification token
- System updates user status to "verified"
- System shows success confirmation
- User can now log in and access booking features

#### Story 3: Resend Verification Email
**As a** unverified user  
**I want to** request a new verification email  
**So that I can** complete my registration if I lost the original email

**Acceptance Criteria:**
- User can request new verification email from login page
- System generates new verification token
- System sends new verification email
- Previous verification tokens are invalidated
- User receives confirmation that new email was sent

## Business Rules

### Registration Rules
1. **Email Uniqueness**: Each email address can only be registered once
2. **Password Security**: Minimum 8 characters, must contain uppercase, lowercase, number
3. **Required Fields**: Email, password, firstName, lastName are mandatory
4. **Phone Validation**: Phone number must be valid format if provided
5. **Account Status**: New accounts start as "unverified" status
6. **Verification Window**: Email verification tokens expire after 24 hours
7. **Token Security**: Verification tokens are cryptographically secure and single-use

### Email Verification Rules
1. **Token Validity**: Each token can only be used once
2. **Token Expiration**: Tokens expire after 24 hours
3. **Account Activation**: Only verified users can make bookings
4. **Login Restriction**: Unverified users can log in but see verification prompt
5. **Resend Limit**: Users can request new verification email maximum 3 times per hour

### Security Rules
1. **Password Hashing**: Passwords must be hashed using bcrypt
2. **Token Generation**: Use crypto.randomBytes for secure token generation
3. **Rate Limiting**: Registration limited to 3 attempts per IP per hour
4. **Input Sanitization**: All user inputs must be sanitized and validated
5. **Email Security**: Verification emails must use secure templates

## Database Schema

### Collection: users
```typescript
{
  _id: ObjectId,
  email: string, // unique, required, indexed
  password: string, // bcrypt hashed, required
  firstName: string, // required
  lastName: string, // required
  phoneNumber?: string, // optional
  status: 'unverified' | 'verified' | 'suspended', // required, default: 'unverified'
  emailVerificationToken?: string, // unique token for verification
  emailVerificationTokenExpires?: Date, // expiration date
  emailVerificationTokenRequestCount: number, // rate limiting, default: 0
  lastEmailVerificationTokenRequest?: Date, // rate limiting
  createdAt: Date, // required, indexed
  updatedAt: Date, // required
  lastLoginAt?: Date
}
```

### Indexes
- `{ email: 1 }` - Unique index for email lookups
- `{ emailVerificationToken: 1 }` - Sparse index for token verification
- `{ createdAt: -1 }` - Index for admin user lists
- `{ status: 1, createdAt: -1 }` - Compound index for user management

## API Endpoints

### POST /api/v1/auth/register
Register new user account with email verification

### POST /api/v1/auth/verify-email
Verify user email with verification token

### POST /api/v1/auth/resend-verification
Resend verification email to unverified user

### GET /api/v1/auth/verify-email/:token
Verify email via URL link (browser redirect)

## UI Components

### Registration Form (`/register`)
- Email input with validation
- Password input with strength indicator
- Confirm password input
- First name and last name inputs
- Phone number input (optional)
- Terms and conditions checkbox
- Register button
- Link to login page

### Email Verification Confirmation (`/register/success`)
- Success message explaining verification email sent
- Instructions to check email and click link
- Resend verification email option
- Timeline showing next steps

### Email Verification Result (`/auth/verify/:token`)
- Success confirmation page
- Redirect to login page
- Error handling for invalid/expired tokens

### Login Page Enhancement
- Show verification prompt for unverified users
- "Resend verification email" link for unverified users
- Clear messaging about account status

## Email Templates

### Welcome/Verification Email
- Professional hotel branding
- Clear verification call-to-action button
- Backup verification link
- Contact information for support
- Token expiration information

### Verification Success Email
- Welcome message
- Account activated confirmation
- Next steps for booking rooms
- Link to login page
