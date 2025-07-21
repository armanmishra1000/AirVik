import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User, IUser, UserStatus } from '../models/user.model';
import { EmailService } from './email.service';

// Custom error classes for better error handling
export class AuthError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AuthError {
  public field: string;
  
  constructor(message: string, field: string) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Interface for registration data
export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Interface for registration response
export interface RegisterResponse {
  userId: string;
  email: string;
  status: UserStatus;
}

// Interface for verification response
export interface VerificationResponse {
  userId: string;
  email: string;
  status: UserStatus;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  REGISTRATION_PER_IP_PER_HOUR: 3,
  VERIFICATION_EMAIL_PER_EMAIL_PER_HOUR: 3,
  TOKEN_EXPIRY_HOURS: 24
};

export class AuthService {
  private emailService: EmailService;
  
  constructor() {
    this.emailService = new EmailService();
  }
  
  /**
   * Register a new user with email verification
   * Based on VikBooking's UsersModelRegistration::register pattern
   */
  async registerUser(userData: RegisterUserData, ipAddress?: string): Promise<RegisterResponse> {
    try {
      // TODO: Implement IP-based rate limiting check
      // Check if IP has exceeded registration attempts (3 per hour)
      await this.checkRegistrationRateLimit(ipAddress);
      
      // TODO: Validate user data
      await this.validateRegistrationData(userData);
      
      // TODO: Check email uniqueness
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new ValidationError('Email address is already registered', 'email');
      }
      
      // TODO: Create new user instance
      const user = new User({
        email: userData.email.toLowerCase(),
        password: userData.password, // Will be hashed by pre-save hook
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        status: UserStatus.UNVERIFIED
      });
      
      // TODO: Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      
      // TODO: Save user to database
      await user.save();
      
      // TODO: Send verification email
      await this.emailService.sendVerificationEmail(user, verificationToken);
      
      // TODO: Log registration event
      console.log(`User registered: ${user.email} (${user._id})`);
      
      return {
        userId: user._id.toString(),
        email: user.email,
        status: user.status
      };
      
    } catch (error) {
      // TODO: Implement proper error logging
      console.error('Registration error:', error);
      
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new AuthError('Registration failed. Please try again.', 500);
    }
  }
  
  /**
   * Verify user's email address with token
   */
  async verifyEmail(token: string): Promise<VerificationResponse> {
    try {
      // TODO: Find user by verification token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpires: { $gt: new Date() }
      });
      
      if (!user) {
        throw new AuthError('Invalid or expired verification token', 404);
      }
      
      // TODO: Check if token is already used (user is verified)
      if (user.status === UserStatus.VERIFIED) {
        throw new AuthError('Email is already verified', 410);
      }
      
      // TODO: Update user status and clear token
      user.status = UserStatus.VERIFIED;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpires = undefined;
      user.emailVerificationTokenRequestCount = 0;
      
      await user.save();
      
      // TODO: Send verification success email
      await this.emailService.sendVerificationSuccessEmail(user);
      
      // TODO: Log verification event
      console.log(`Email verified: ${user.email} (${user._id})`);
      
      return {
        userId: user._id.toString(),
        email: user.email,
        status: user.status
      };
      
    } catch (error) {
      // TODO: Implement proper error logging
      console.error('Email verification error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Email verification failed. Please try again.', 500);
    }
  }
  
  /**
   * Resend verification email with rate limiting
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      // TODO: Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new AuthError('Email address not found', 404);
      }
      
      // TODO: Check if user is already verified
      if (user.status === UserStatus.VERIFIED) {
        throw new AuthError('Email is already verified', 409);
      }
      
      // TODO: Check rate limiting (3 requests per hour)
      await this.checkResendRateLimit(user);
      
      // TODO: Generate new verification token (invalidates previous)
      const verificationToken = user.generateEmailVerificationToken();
      
      // TODO: Update rate limiting counters
      user.emailVerificationTokenRequestCount += 1;
      user.lastEmailVerificationTokenRequest = new Date();
      
      await user.save();
      
      // TODO: Send new verification email
      await this.emailService.sendVerificationEmail(user, verificationToken);
      
      // TODO: Log resend event
      console.log(`Verification email resent: ${user.email} (${user._id})`);
      
    } catch (error) {
      // TODO: Implement proper error logging
      console.error('Resend verification error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Failed to resend verification email. Please try again.', 500);
    }
  }
  
  /**
   * Generate secure verification token
   */
  generateSecureToken(): string {
    // TODO: Implement crypto.randomBytes for secure token generation
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    // TODO: Implement password hashing with salt
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Validate registration data
   */
  private async validateRegistrationData(data: RegisterUserData): Promise<void> {
    const errors: ValidationError[] = [];
    
    // TODO: Email validation
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push(new ValidationError('Please provide a valid email address', 'email'));
    }
    
    // TODO: Password strength validation
    if (!data.password || !this.isValidPassword(data.password)) {
      errors.push(new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
        'password'
      ));
    }
    
    // TODO: Name validation
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 50) {
      errors.push(new ValidationError('First name must be 2-50 characters', 'firstName'));
    }
    
    if (!data.lastName || data.lastName.length < 2 || data.lastName.length > 50) {
      errors.push(new ValidationError('Last name must be 2-50 characters', 'lastName'));
    }
    
    // TODO: Phone number validation (optional)
    if (data.phoneNumber && !this.isValidPhoneNumber(data.phoneNumber)) {
      errors.push(new ValidationError('Please provide a valid phone number', 'phoneNumber'));
    }
    
    if (errors.length > 0) {
      throw errors[0]; // Throw first validation error
    }
  }
  
  /**
   * Check registration rate limit for IP
   */
  private async checkRegistrationRateLimit(ipAddress?: string): Promise<void> {
    if (!ipAddress) return;
    
    // TODO: Implement Redis-based rate limiting
    // Check if IP has made more than 3 registration attempts in last hour
    // For now, just log the check
    console.log(`Checking registration rate limit for IP: ${ipAddress}`);
  }
  
  /**
   * Check resend verification rate limit for user
   */
  private async checkResendRateLimit(user: IUser): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // TODO: Reset counter if last request was more than an hour ago
    if (user.lastEmailVerificationTokenRequest && 
        user.lastEmailVerificationTokenRequest < oneHourAgo) {
      user.emailVerificationTokenRequestCount = 0;
    }
    
    // TODO: Check if user has exceeded rate limit
    if (user.emailVerificationTokenRequestCount >= RATE_LIMIT_CONFIG.VERIFICATION_EMAIL_PER_EMAIL_PER_HOUR) {
      const remainingTime = user.lastEmailVerificationTokenRequest ? 
        (60 * 60 * 1000) - (Date.now() - user.lastEmailVerificationTokenRequest.getTime()) : 0;
      
      throw new AuthError(
        `Too many verification email requests. Please wait ${Math.ceil(remainingTime / 1000 / 60)} minutes.`,
        429
      );
    }
  }
  
  /**
   * Email format validation
   */
  private isValidEmail(email: string): boolean {
    // TODO: Implement comprehensive email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  /**
   * Password strength validation
   */
  private isValidPassword(password: string): boolean {
    // TODO: Implement password strength requirements
    // At least 8 characters, uppercase, lowercase, number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }
  
  /**
   * Phone number format validation
   */
  private isValidPhoneNumber(phone: string): boolean {
    // TODO: Implement international phone number validation
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
  }
}

// TODO: Add comprehensive unit tests
// TODO: Add integration tests with database
// TODO: Add performance monitoring
// TODO: Add audit logging for security events
// TODO: Add email delivery status tracking
// TODO: Implement distributed rate limiting with Redis
// TODO: Add user activity tracking
// TODO: Implement account recovery flows
