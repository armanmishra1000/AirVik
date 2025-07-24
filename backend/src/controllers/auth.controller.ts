import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { 
  AuthService, 
  AuthError, 
  ValidationError, 
  RegisterUserData, 
  LoginUserData,
  PasswordResetData,
  UpdateProfileData,
  ChangePasswordData,
  authService
} from '../services/auth.service';

// Interface for standardized API responses
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  code?: string;
  timestamp: string;
  requestId?: string;
}

export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = authService;
  }
  
  /**
   * Validation rules for user registration
   */
  registerValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    body('phoneNumber')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number')
  ];

  /**
   * Register new user account
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data using express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Extract user data from request
      const userData: RegisterUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber
      };
      
      // Get client IP for rate limiting
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Call auth service to register user
      const result = await this.authService.registerUser(userData, clientIP);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Registration successful. Please check your email for verification instructions.',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(201).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for user login
   */
  loginValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean value')
  ];

  /**
   * Login user with email and password
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Extract login data
      const loginData: LoginUserData = {
        email: req.body.email,
        password: req.body.password,
        rememberMe: req.body.rememberMe === true
      };
      
      // Get client IP for rate limiting
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Call auth service to login user
      const result = await this.authService.loginUser(loginData, clientIP);
      
      // Set cookies for tokens if needed
      // Access token - httpOnly, secure in production
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      // Refresh token - httpOnly, secure in production
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: loginData.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 1 day
      });
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Verify user email with token
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const { token } = req.body;
      
      // Call auth service to verify email
      const result = await this.authService.verifyEmail(token);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Verify email via URL link (browser redirect)
   * GET /api/v1/auth/verify-email/:token
   */
  verifyEmailRedirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      
      if (!token) {
        // Redirect to error page
        res.redirect(`/auth/verify-error?error=missing_token`);
        return;
      }
      
      try {
        // Call auth service to verify email
        await this.authService.verifyEmail(token);
        
        // Redirect to success page
        res.redirect(`/auth/verify-success`);
      } catch (verifyError) {
        // Handle specific error types for better UX
        let errorCode = 'unknown_error';
        
        if (verifyError instanceof AuthError) {
          if (verifyError.message.includes('expired')) {
            errorCode = 'token_expired';
          } else if (verifyError.message.includes('invalid')) {
            errorCode = 'invalid_token';
          } else if (verifyError.message.includes('already verified')) {
            errorCode = 'already_verified';
          }
        }
        
        // Redirect to error page with specific error code
        res.redirect(`/auth/verify-error?error=${errorCode}`);
      }
      res.redirect(`/auth/verify-success?verified=true`);
      
    } catch (error) {
      // TODO: Handle different error types with appropriate redirects
      if (error instanceof AuthError) {
        switch (error.statusCode) {
          case 404:
            res.redirect(`/auth/verify-error?error=invalid_token`);
            break;
          case 410:
            res.redirect(`/auth/verify-error?error=already_used`);
            break;
          default:
            res.redirect(`/auth/verify-error?error=verification_failed`);
        }
      } else {
        res.redirect(`/auth/verify-error?error=server_error`);
      }
    }
  };
  
  /**
   * Validation rules for resend verification email
   */
  resendVerificationEmailValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim()
  ];

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   */
  resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const { email } = req.body;
      
      // TODO: Call auth service to resend verification email
      await this.authService.resendVerificationEmail(email);
      
      // TODO: Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
        data: {
          email: email,
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Get current user profile (authenticated endpoint)
   * GET /api/v1/users/profile
   */
  getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user from authentication middleware
      const userId = (req as any).user?._id;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Call auth service to get user profile
      const userProfile = await this.authService.getUserProfile(userId);
      
      // Send user profile data
      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        data: userProfile,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for update profile
   */
  updateProfileValidation = [
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('preferences.newsletter')
      .optional()
      .isBoolean()
      .withMessage('Newsletter preference must be a boolean value'),
    body('preferences.notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications preference must be a boolean value'),
    body('preferences.language')
      .optional()
      .isString()
      .withMessage('Language preference must be a string')
      .isLength({ min: 2, max: 5 })
      .withMessage('Language code must be between 2 and 5 characters')
  ];

  /**
   * Update user profile (authenticated endpoint)
   * PUT /api/v1/users/profile
   */
  updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Get user from authentication middleware
      const userId = (req as any).user?._id;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Extract update data from request
      const updateData: UpdateProfileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone
      };
      
      // Call auth service to update user profile
      const updatedProfile = await this.authService.updateProfile(userId, updateData);
      
      // Send updated user data
      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for change password
   */
  changePasswordValidation = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
      .custom((value: string, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ];

  /**
   * Change user password (authenticated endpoint)
   * POST /api/v1/users/change-password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Get user from authentication middleware
      const userId = (req as any).user?._id;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Extract password data from request
      const passwordData: ChangePasswordData = {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword
      };
      
      // Call auth service to change password
      await this.authService.changePassword(userId, passwordData);
      
      // Clear existing tokens by setting expired cookies
      res.cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully. Please log in again with your new password.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Delete user account (authenticated endpoint)
   * DELETE /api/v1/users/account
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user from authentication middleware
      const userId = (req as any).user?._id;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Call auth service to delete account
      await this.authService.deleteAccount(userId);
      
      // Clear existing tokens by setting expired cookies
      res.cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Account deleted successfully.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for password reset request
   */
  forgotPasswordValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim()
  ];

  /**
   * Request password reset email
   * POST /api/v1/auth/forgot-password
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const { email } = req.body;
      
      // Get client IP for rate limiting
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Call auth service to request password reset
      await this.authService.requestPasswordReset(email, clientIP);
      
      // Send success response (always return success even if email not found for security)
      const response: ApiResponse = {
        success: true,
        message: 'If your email is registered, you will receive password reset instructions.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      // For security reasons, we don't want to expose if the email exists or not
      // So we always return a success response even if there's an error
      // Unless it's a rate limiting error
      if (error instanceof AuthError && error.statusCode === 429) {
        this.handleError(error, res, next);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'If your email is registered, you will receive password reset instructions.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
    }
  };
  
  /**
   * Validation rules for reset password
   */
  resetPasswordValidation = [
    body('token')
      .notEmpty()
      .withMessage('Token is required')
      .isString()
      .withMessage('Token must be a string')
      .trim(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/) // Requires lowercase, uppercase, and number
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ];

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Extract password reset data
      const passwordResetData: PasswordResetData = {
        token: req.body.token,
        newPassword: req.body.newPassword
      };
      
      // Call auth service to reset password
      await this.authService.resetPassword(passwordResetData.token, passwordResetData.newPassword);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for validate reset token
   */
  validateResetTokenValidation = [
    param('token')
      .notEmpty()
      .withMessage('Token is required')
      .isString()
      .withMessage('Token must be a string')
      .trim()
  ];

  /**
   * Validate password reset token
   * GET /api/v1/auth/validate-reset-token/:token
   */
  validateResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      
      if (!token) {
        const response: ApiResponse = {
          success: false,
          message: 'Token is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Call auth service to validate token
      await this.authService.verifyToken(token);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Token is valid',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for refresh token
   */
  refreshTokenValidation = [
    body('refreshToken')
      .optional()
      .isString()
      .withMessage('Refresh token must be a string')
      .trim()
  ];

  /**
   * Refresh authentication token
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Call auth service to refresh token
      const result = await this.authService.refreshToken(refreshToken);
      
      // Set cookies for new tokens
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Logout user (revoke refresh token)
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        // Call auth service to revoke refresh token
        await this.authService.logoutUser(refreshToken);
      }
      
      // Clear cookies regardless of token presence
      res.cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      // Always return success for logout, even if there was an error
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
    }
  };
  
  /**
   * Validation rules for get all users (admin)
   */
  getAllUsersValidation = [
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    body('role')
      .optional()
      .isIn(['customer', 'manager', 'admin'])
      .withMessage('Role must be one of: customer, manager, admin'),
    body('verified')
      .optional()
      .isBoolean()
      .withMessage('Email verification status must be a boolean'),
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active status must be a boolean')
  ];

  /**
   * Get all users (admin endpoint)
   * GET /api/v1/admin/users
   */
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user from authentication middleware
      const adminId = (req as any).user?._id;
      const role = (req as any).user?.role;
      
      if (!adminId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Check if user is admin
      if (role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }
      
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get filter parameters
      const filters = {
        role: req.query.role as string,
        isEmailVerified: req.query.verified === 'true' ? true : 
                        req.query.verified === 'false' ? false : undefined,
        isActive: req.query.active === 'true' ? true : 
                req.query.active === 'false' ? false : undefined
      };
      
      // Call auth service to get all users
      const result = await this.authService.getAllUsers(page, limit, filters);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for get user by ID (admin)
   */
  getUserByIdValidation = [
    param('id')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format')
  ];

  /**
   * Get user by ID (admin endpoint)
   * GET /api/v1/admin/users/:id
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user from authentication middleware
      const adminId = (req as any).user?._id;
      const role = (req as any).user?.role;
      
      if (!adminId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Check if user is admin
      if (role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }
      
      const userId = req.params.id;
      
      // Call auth service to get user by ID
      const user = await this.authService.getUserProfile(userId);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Validation rules for update user by ID (admin)
   */
  updateUserByIdValidation = [
    param('id')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('role')
      .optional()
      .isIn(['customer', 'manager', 'admin'])
      .withMessage('Role must be one of: customer, manager, admin'),
    body('isEmailVerified')
      .optional()
      .isBoolean()
      .withMessage('Email verification status must be a boolean'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Active status must be a boolean')
  ];

  /**
   * Update user by ID (admin endpoint)
   * PUT /api/v1/admin/users/:id
   */
  updateUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error: any) => ({
            field: error.param || 'unknown',
            message: error.msg
          })),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      // Get user from authentication middleware
      const adminId = (req as any).user?._id;
      const role = (req as any).user?.role;
      
      if (!adminId) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }
      
      // Check if user is admin
      if (role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }
      
      const userId = req.params.id;
      
      // Extract update data from request
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        role: req.body.role,
        isEmailVerified: req.body.isEmailVerified,
        isActive: req.body.isActive
      };
      
      // Call auth service to update user
      const updatedUser = await this.authService.updateUserAdmin(userId, updateData);
      
      // Send success response
      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error: unknown) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Centralized error handling
   */
  private handleError(error: unknown, res: Response, next: NextFunction): void {
    // TODO: Implement comprehensive error logging
    console.error('Auth Controller Error:', error);
    
    let statusCode = 500;
    let message = 'Internal server error';
    let errors: {field: string, message: string}[] = [];
    
    if (error instanceof ValidationError) {
      statusCode = 400;
      message = 'Validation failed';
      errors = [{
        field: error.field,
        message: error.message
      }];
    } else if (error instanceof AuthError) {
      statusCode = error.statusCode;
      message = error.message;
    }
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      code: error instanceof AuthError ? error.code || 'AUTH_ERROR' : 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }
}

// TODO: Add request ID generation middleware
// TODO: Add comprehensive input sanitization
// TODO: Add request/response logging middleware
// TODO: Add API documentation with Swagger
// TODO: Add endpoint-specific rate limiting
// TODO: Add CORS configuration
// TODO: Add security headers middleware
// TODO: Add request timeout handling
// TODO: Add health check endpoints
// TODO: Add metrics collection for monitoring
