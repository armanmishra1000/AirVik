import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { User, IUser, UserRole } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { EmailVerificationToken } from '../models/email-verification-token.model';
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

// Interface for login data
export interface LoginUserData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Interface for password reset data
export interface PasswordResetData {
  token: string;
  newPassword: string;
}

// Interface for profile update data
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  preferences?: {
    newsletter?: boolean;
    notifications?: boolean;
    language?: string;
  };
}

// Interface for password change data
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Interface for JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

// Interface for authentication response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isEmailVerified: boolean;
    profileImage?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Interface for registration response
export interface RegisterResponse {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
}

// Interface for verification response
export interface VerificationResponse {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
}

// Rate limiting and security configuration
const RATE_LIMIT_CONFIG = {
  REGISTRATION_PER_IP_PER_HOUR: 3,
  VERIFICATION_EMAIL_PER_EMAIL_PER_HOUR: 3,
  LOGIN_ATTEMPTS_BEFORE_LOCKOUT: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_RESET_PER_EMAIL_PER_HOUR: 3,
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1
};

// JWT configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'
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
        role: UserRole.CUSTOMER,
        isEmailVerified: false,
        isActive: true
      });
      
      // TODO: Generate email verification token
      const verificationToken = this.generateSecureToken();
      
      // Create email verification token document
      const tokenDoc = new EmailVerificationToken({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + RATE_LIMIT_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
      });
      
      await tokenDoc.save();
      
      // TODO: Save user to database
      await user.save();
      
      // TODO: Send verification email
      await this.emailService.sendVerificationEmail(user, verificationToken);
      
      // TODO: Log registration event
      console.log(`User registered: ${user.email} (${user._id})`);
      
      return {
        userId: (user._id as Types.ObjectId).toString(),
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
      // TODO: Find user by verification token using separate token model
      const tokenDoc = await EmailVerificationToken.findOne({
        token: token,
        expiresAt: { $gt: new Date() },
        usedAt: { $exists: false }
      });
      
      if (!tokenDoc) {
        throw new AuthError('Invalid or expired verification token', 404);
      }
      
      const user = await User.findById(tokenDoc.userId) as IUser;
      

      
      // TODO: Check if token is already used (user is verified)
      if (user.isEmailVerified) {
        throw new AuthError('Email is already verified', 410);
      }
      
      // TODO: Update user status and mark token as used
      user.isEmailVerified = true;
      await user.save();
      
      // Mark token as used
      tokenDoc.usedAt = new Date();
      await tokenDoc.save();
      
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
      if (user.isEmailVerified) {
        throw new AuthError('Email is already verified', 409);
      }
      
      // TODO: Check rate limiting (3 requests per hour)
      await this.checkResendRateLimit(user);
      
      // TODO: Invalidate previous tokens and generate new one
      await EmailVerificationToken.updateMany(
        { userId: user._id, usedAt: { $exists: false } },
        { usedAt: new Date() }
      );
      
      const verificationToken = this.generateSecureToken();
      
      // Create new email verification token document
      const tokenDoc = new EmailVerificationToken({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + RATE_LIMIT_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
      });
      
      await tokenDoc.save();
      
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
    
    // TODO: Check rate limit using token model
    const recentTokens = await EmailVerificationToken.countDocuments({
      userId: user._id,
      createdAt: { $gte: oneHourAgo }
    });
    
    if (recentTokens >= RATE_LIMIT_CONFIG.VERIFICATION_EMAIL_PER_EMAIL_PER_HOUR) {
      throw new AuthError(
        `Too many verification email requests. Please wait before requesting another.`,
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
    return /^[\+]?[0-9]{7,15}$/.test(phone);
  }

  /**
   * Login user with email and password
   */
  async loginUser(loginData: LoginUserData, ipAddress?: string): Promise<AuthResponse> {
    try {
      // TODO: Find user by email
      const user = await User.findOne({ email: loginData.email.toLowerCase() });
      
      if (!user) {
        throw new AuthError('Invalid email or password', 401);
      }
      
      // TODO: Check if account is locked
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000 / 60);
        throw new AuthError(`Account is locked. Please try again in ${remainingTime} minutes.`, 423);
      }
      
      // TODO: Check if account is active
      if (!user.isActive) {
        throw new AuthError('Account has been deactivated. Please contact support.', 403);
      }
      
      // TODO: Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);
      
      if (!isPasswordValid) {
        // TODO: Increment login attempts
        user.loginAttempts += 1;
        
        // TODO: Lock account if too many attempts
        if (user.loginAttempts >= RATE_LIMIT_CONFIG.LOGIN_ATTEMPTS_BEFORE_LOCKOUT) {
          user.lockoutUntil = new Date(Date.now() + RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
          await user.save();
          throw new AuthError('Too many failed login attempts. Account has been locked.', 423);
        }
        
        await user.save();
        throw new AuthError('Invalid email or password', 401);
      }
      
      // TODO: Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockoutUntil = undefined;
      user.lastLoginAt = new Date();
      await user.save();
      
      // TODO: Generate JWT tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);
      
      // TODO: Log login event
      console.log(`User logged in: ${user.email} (${user._id})`);
      
      return {
        user: {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage
        },
        accessToken,
        refreshToken
      };
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Login failed. Please try again.', 500);
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JWTPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };
    
    // Generate access token
    const accessToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY
    });
    
    // Generate refresh token
    const refreshTokenValue = jwt.sign(
      { userId: payload.userId },
      JWT_CONFIG.REFRESH_SECRET,
      { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
    );
    
    // Store refresh token in database
    const refreshToken = new RefreshToken({
      userId: user._id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await refreshToken.save();
    
    return { accessToken, refreshToken: refreshTokenValue };
  }

  /**
   * Refresh JWT access token using refresh token
   */
  async refreshToken(refreshTokenValue: string): Promise<{ accessToken: string }> {
    try {
      // TODO: Verify refresh token
      const decoded = jwt.verify(refreshTokenValue, JWT_CONFIG.REFRESH_SECRET) as { userId: string };
      
      // TODO: Find refresh token in database
      const refreshToken = await RefreshToken.findOne({
        token: refreshTokenValue,
        expiresAt: { $gt: new Date() },
        isRevoked: false
      });
      
      if (!refreshToken) {
        throw new AuthError('Invalid or expired refresh token', 401);
      }
      
      // TODO: Find user
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new AuthError('User not found or inactive', 401);
      }
      
      // TODO: Generate new access token
      const payload: JWTPayload = {
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      };
      
      const accessToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY
      });
      
      return { accessToken };
      
    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Token refresh failed', 401);
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  async logoutUser(refreshTokenValue: string): Promise<void> {
    try {
      // TODO: Revoke refresh token
      await RefreshToken.updateOne(
        { token: refreshTokenValue },
        { isRevoked: true }
      );
      
      console.log('User logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      throw new AuthError('Logout failed', 500);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // TODO: Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Don't reveal if email exists for security
        return;
      }
      
      // TODO: Check rate limiting
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentResets = await EmailVerificationToken.countDocuments({
        userId: user._id,
        createdAt: { $gte: oneHourAgo }
      });
      
      if (recentResets >= RATE_LIMIT_CONFIG.PASSWORD_RESET_PER_EMAIL_PER_HOUR) {
        throw new AuthError('Too many password reset requests. Please wait before requesting another.', 429);
      }
      
      // TODO: Generate password reset token
      const resetToken = this.generateSecureToken();
      
      // Create password reset token document (reusing EmailVerificationToken model)
      const tokenDoc = new EmailVerificationToken({
        userId: user._id,
        token: resetToken,
        expiresAt: new Date(Date.now() + RATE_LIMIT_CONFIG.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000)
      });
      
      await tokenDoc.save();
      
      // TODO: Send password reset email
      await this.emailService.sendPasswordResetEmail(user, resetToken);
      
      console.log(`Password reset requested: ${user.email} (${user._id})`);
      
    } catch (error) {
      console.error('Password reset request error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Password reset request failed', 500);
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetData: PasswordResetData): Promise<void> {
    try {
      // TODO: Find and validate reset token
      const tokenDoc = await EmailVerificationToken.findOne({
        token: resetData.token,
        expiresAt: { $gt: new Date() },
        usedAt: { $exists: false }
      });
      
      if (!tokenDoc) {
        throw new AuthError('Invalid or expired reset token', 404);
      }
      
      const user = await User.findById(tokenDoc.userId) as IUser;
      
      // TODO: Validate new password
      if (!this.isValidPassword(resetData.newPassword)) {
        throw new ValidationError(
          'Password must be at least 8 characters with uppercase, lowercase, and number',
          'newPassword'
        );
      }
      
      // TODO: Update user password
      user.password = resetData.newPassword; // Will be hashed by pre-save hook
      user.loginAttempts = 0; // Reset login attempts
      user.lockoutUntil = undefined; // Remove any lockout
      await user.save();
      
      // TODO: Mark token as used
      tokenDoc.usedAt = new Date();
      await tokenDoc.save();
      
      // TODO: Revoke all refresh tokens for security
      await RefreshToken.updateMany(
        { userId: user._id },
        { isRevoked: true }
      );
      
      // TODO: Send password reset confirmation email
      await this.emailService.sendPasswordResetConfirmationEmail(user);
      
      console.log(`Password reset completed: ${user.email} (${user._id})`);
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new AuthError('Password reset failed', 500);
    }
  }

  /**
   * Change user password (authenticated)
   */
  async changePassword(userId: string, passwordData: ChangePasswordData): Promise<void> {
    try {
      // TODO: Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AuthError('User not found', 404);
      }
      
      // TODO: Verify current password
      const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new AuthError('Current password is incorrect', 400);
      }
      
      // TODO: Validate new password
      if (!this.isValidPassword(passwordData.newPassword)) {
        throw new ValidationError(
          'Password must be at least 8 characters with uppercase, lowercase, and number',
          'newPassword'
        );
      }
      
      // TODO: Update password
      user.password = passwordData.newPassword; // Will be hashed by pre-save hook
      await user.save();
      
      // TODO: Revoke all refresh tokens for security
      await RefreshToken.updateMany(
        { userId: user._id },
        { isRevoked: true }
      );
      
      console.log(`Password changed: ${user.email} (${user._id})`);
      
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new AuthError('Password change failed', 500);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<IUser> {
    try {
      // TODO: Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AuthError('User not found', 404);
      }
      
      // TODO: Validate profile data
      if (profileData.firstName && (profileData.firstName.length < 2 || profileData.firstName.length > 50)) {
        throw new ValidationError('First name must be 2-50 characters', 'firstName');
      }
      
      if (profileData.lastName && (profileData.lastName.length < 2 || profileData.lastName.length > 50)) {
        throw new ValidationError('Last name must be 2-50 characters', 'lastName');
      }
      
      if (profileData.phoneNumber && !this.isValidPhoneNumber(profileData.phoneNumber)) {
        throw new ValidationError('Please provide a valid phone number', 'phoneNumber');
      }
      
      // TODO: Update user fields
      if (profileData.firstName) user.firstName = profileData.firstName;
      if (profileData.lastName) user.lastName = profileData.lastName;
      if (profileData.phoneNumber !== undefined) user.phone = profileData.phoneNumber;
      if (profileData.dateOfBirth) user.dateOfBirth = profileData.dateOfBirth;
      
      if (profileData.preferences) {
        if (profileData.preferences.newsletter !== undefined) {
          user.preferences.newsletter = profileData.preferences.newsletter;
        }
        if (profileData.preferences.notifications !== undefined) {
          user.preferences.notifications = profileData.preferences.notifications;
        }
        if (profileData.preferences.language) {
          user.preferences.language = profileData.preferences.language;
        }
      }
      
      await user.save();
      
      console.log(`Profile updated: ${user.email} (${user._id})`);
      
      return user;
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new AuthError('Profile update failed', 500);
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        throw new AuthError('User not found', 404);
      }
      
      return user;
      
    } catch (error) {
      console.error('Get user profile error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Failed to get user profile', 500);
    }
  }

  /**
   * Verify JWT token and return user data
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as JWTPayload;
      
      // TODO: Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new AuthError('User not found or inactive', 401);
      }
      
      return decoded;
      
    } catch (error) {
      console.error('Token verification error:', error);
      throw new AuthError('Invalid or expired token', 401);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      // TODO: Find user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AuthError('User not found', 404);
      }
      
      // TODO: Revoke all tokens
      await RefreshToken.deleteMany({ userId: user._id });
      await EmailVerificationToken.deleteMany({ userId: user._id });
      
      // TODO: Soft delete user (deactivate)
      user.isActive = false;
      user.email = `deleted_${Date.now()}_${user.email}`; // Prevent email conflicts
      await user.save();
      
      console.log(`Account deleted: ${user.email} (${user._id})`);
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Account deletion failed', 500);
    }
  }
}

// Export the service instance
export const authService = new AuthService();

// TODO: Add comprehensive unit tests
// TODO: Add integration tests with database
// TODO: Add performance monitoring
// TODO: Add audit logging for security events
// TODO: Add email delivery status tracking
// TODO: Implement distributed rate limiting with Redis
// TODO: Add user activity tracking
// TODO: Implement account recovery flows
