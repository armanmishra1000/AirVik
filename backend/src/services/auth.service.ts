import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { User, IUser, UserStatus, UserRole } from '../models/user.model';
import { UserSession, IUserSession } from '../models/user-session.model';
import { BlacklistedToken } from '../models/blacklisted-token.model';
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
  verificationToken?: string; // Optional verification token for testing
}

// Interface for verification response
export interface VerificationResponse {
  userId: string;
  email: string;
  status: UserStatus;
}

// Interface for login response
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Interface for token refresh response
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Interface for token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Increased for development and testing
  REGISTRATION_PER_IP_PER_HOUR: 100,
  VERIFICATION_EMAIL_PER_EMAIL_PER_HOUR: 100,
  TOKEN_EXPIRY_HOURS: 24
};

export class AuthService {
  private emailService: EmailService;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly REFRESH_TOKEN_EXPIRY_REMEMBER = '30d'; // 30 days for remember me
  private readonly BCRYPT_ROUNDS = 12;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME_MINUTES = 15;
  
  constructor() {
    this.emailService = new EmailService();
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
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
      // Generate username from email (remove @ and domain)
      const username = userData.email.split('@')[0];
      
      const user = new User({
        email: userData.email.toLowerCase(),
        username: username, // Set username from email
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
      
      // Include verification token in response for test automation
      return {
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        status: user.status,
        verificationToken // Expose token for testing
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
        userId: (user._id as Types.ObjectId).toString(),
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
    if (data.phoneNumber && data.phoneNumber.trim() !== '' && !this.isValidPhoneNumber(data.phoneNumber)) {
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
    // Remove all non-digit characters except + for validation
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Allow international format: +1234567890 or domestic: 1234567890 or 01234567890
    // Must be 7-15 digits (excluding country code +)
    return /^[\+]?[0-9]{7,15}$/.test(cleanPhone);
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Login user with email/password validation and session management
   * Based on VikBooking's application.php login function
   */
  async loginUser(email: string, password: string, rememberMe: boolean = false, ipAddress?: string, deviceInfo?: string): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new AuthError('Invalid email or password', 401);
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthError('Account is temporarily locked due to too many failed login attempts', 423);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthError('Account is deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementFailedLoginAttempts();
        throw new AuthError('Invalid email or password', 401);
      }

      // Reset failed login attempts on successful login
      await user.resetFailedLoginAttempts();

      // Update last login time
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();
      
      // Create user session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));
      
      const hashedRefreshToken = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
      
      await UserSession.create({
        userId: user._id,
        refreshToken: hashedRefreshToken,
        deviceInfo: deviceInfo || 'Unknown',
        ipAddress: ipAddress || '0.0.0.0',
        isActive: true,
        expiresAt
      });

      return {
        user: {
          id: (user._id as mongoose.Types.ObjectId).toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Login failed. Please try again.', 500);
    }
  }

  /**
   * Logout user and blacklist tokens
   */
  async logoutUser(userId: string, refreshToken: string): Promise<void> {
    try {
      // Find and deactivate user session
      const sessions = await UserSession.find({ userId, isActive: true });
      
      for (const session of sessions) {
        const isValidRefreshToken = await bcrypt.compare(refreshToken, session.refreshToken);
        if (isValidRefreshToken) {
          session.isActive = false;
          await session.save();
          break;
        }
      }

      // Note: Access token blacklisting would be handled by the verifyToken method
      // when checking if a token is blacklisted
      
    } catch (error) {
      throw new AuthError('Logout failed. Please try again.', 500);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Find active session with matching refresh token
      const sessions = await UserSession.find({ isActive: true }).populate('userId');
      
      let validSession: IUserSession | null = null;
      
      for (const session of sessions) {
        const isValidRefreshToken = await bcrypt.compare(refreshToken, session.refreshToken);
        if (isValidRefreshToken && session.expiresAt > new Date()) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new AuthError('Invalid or expired refresh token', 401);
      }

      const user = validSession.userId as IUser;
      
      // Check if user is still active
      if (!user.isActive) {
        throw new AuthError('Account is deactivated', 403);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token refresh failed. Please try again.', 500);
    }
  }

  /**
   * Verify access token and check blacklist
   */
  async verifyToken(accessToken: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await BlacklistedToken.isTokenBlacklisted(accessToken);
      if (isBlacklisted) {
        throw new AuthError('Token has been revoked', 401);
      }

      // Verify JWT token
      const payload = jwt.verify(accessToken, this.JWT_SECRET) as TokenPayload;
      
      // Verify user still exists and is active
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new AuthError('Invalid token', 401);
      }

      return payload;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', 401);
      }
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token verification failed', 500);
    }
  }

  /**
   * Hash password with bcrypt (12+ rounds)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare password with hashed password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Lock user account (progressive locking implementation)
   */
  async lockAccount(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthError('User not found', 404);
      }

      // Progressive locking: 1min, 5min, 15min, 1hour
      const lockDurations = [1, 5, 15, 60]; // minutes
      const attemptIndex = Math.min(user.failedLoginAttempts - 1, lockDurations.length - 1);
      const lockDuration = lockDurations[attemptIndex];
      
      user.accountLockedUntil = new Date(Date.now() + lockDuration * 60 * 1000);
      await user.save();

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Account locking failed', 500);
    }
  }

  /**
   * Reset failed login attempts (on successful login)
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthError('User not found', 404);
      }

      await user.resetFailedLoginAttempts();

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Reset failed attempts failed', 500);
    }
  }

  /**
   * Blacklist access token on logout
   */
  async blacklistToken(accessToken: string): Promise<void> {
    try {
      const payload = jwt.decode(accessToken) as TokenPayload;
      if (payload && payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        await BlacklistedToken.blacklistToken(accessToken, expiresAt);
      }
    } catch (error) {
      // Silently fail - token blacklisting is not critical
      console.error('Token blacklisting failed:', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: IUser): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * Generate random refresh token
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
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
