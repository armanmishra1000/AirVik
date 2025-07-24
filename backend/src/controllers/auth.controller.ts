import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { AuthService, AuthError, ValidationError, RegisterUserData, LoginResponse } from '../services/auth.service';
import { verifyAccessToken, blacklistToken, getTokenPayload } from '../utils/jwt.util';

// Interface for standardized API responses
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  requestId?: string;
}

export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = new AuthService();
  }
  
  /**
   * Register new user account
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Validate request data using express-validator
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
      
      // TODO: Extract user data from request
      const userData: RegisterUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber
      };
      
      // TODO: Get client IP for rate limiting
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // TODO: Call auth service to register user
      const result = await this.authService.registerUser(userData, clientIP);
      // Standard response data
      const responseData = {
        _id: result.userId, // Use userId from RegisterResponse instead of _id
        email: result.email,
        status: result.status,
        // Include verification token for test automation
        verificationToken: result.verificationToken
      };
      // TODO: Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Registration successful. Please check your email for verification instructions.',
        data: responseData,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      // TODO: Handle different error types appropriately
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Verify user email with token
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      
      const { token } = req.body;
      
      // TODO: Call auth service to verify email
      const result = await this.authService.verifyEmail(token);
      
      // TODO: Send success response
      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        data: {
          ...result,
          isVerified: result.status === 'verified' // Explicitly add isVerified property
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error) {
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
        // TODO: Redirect to error page
        res.redirect(`/auth/verify-error?error=missing_token`);
        return;
      }
      
      // TODO: Call auth service to verify email
      await this.authService.verifyEmail(token);
      
      // TODO: Redirect to success page
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
      
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Get current user profile (authenticated endpoint)
   * GET /api/v1/users/profile
   */
  getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get user from authentication middleware
      const user = (req as any).user; // Assuming auth middleware adds user to request
      
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      // TODO: Send user profile data
      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Update user profile (authenticated endpoint)
   * PUT /api/v1/users/profile
   */
  updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      
      // TODO: Get user from authentication middleware
      const user = (req as any).user;
      
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      // TODO: Update allowed fields only
      const allowedUpdates = ['firstName', 'lastName', 'phoneNumber'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);
      
      // TODO: Apply updates to user
      Object.assign(user, updates);
      await user.save();
      
      // TODO: Send updated user data
      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          status: user.status,
          updatedAt: user.updatedAt
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
  
  /**
   * Centralized error handling
   */
  private handleError(error: any, res: Response, next: NextFunction): void {
    // TODO: Implement comprehensive error logging
    console.error('Auth Controller Error:', error);
    
    let statusCode = 500;
    let message = 'Internal server error';
    let errors: any[] = [];
    
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
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  /**
   * User login
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

      const { email, password, rememberMe = false } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const deviceInfo = req.get('User-Agent') || 'Unknown';

      // Call auth service to login user
      const loginResult: LoginResponse = await this.authService.loginUser(
        email,
        password,
        rememberMe,
        clientIP,
        deviceInfo
      );

      // Set httpOnly cookies for tokens
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/'
      };

      // Set access token cookie (15 minutes)
      res.cookie('access_token', loginResult.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Set refresh token cookie (7 or 30 days)
      res.cookie('refresh_token', loginResult.refreshToken, {
        ...cookieOptions,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
      });

      // Log authentication event
      console.log(`User login successful: ${loginResult.user.email} from ${clientIP}`);

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: loginResult.user,
          expiresIn: loginResult.expiresIn
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      // Log failed login attempt
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      console.error(`Login failed from ${clientIP}:`, error);
      this.handleError(error, res, next);
    }
  };

  /**
   * User logout
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Safely access cookies with fallback
      const accessToken = req.cookies?.access_token;
      const refreshToken = req.cookies?.refresh_token;
      const user = (req as any).user; // From auth middleware
      
      // Also check Authorization header as fallback
      const authHeader = req.headers.authorization;
      const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      // Try to logout with available tokens
      if (user) {
        if (refreshToken) {
          // Logout user and blacklist tokens
          await this.authService.logoutUser(user.userId, refreshToken);
        }
        
        // Blacklist access token (from cookie or header)
        const tokenToBlacklist = accessToken || tokenFromHeader;
        if (tokenToBlacklist) {
          await blacklistToken(tokenToBlacklist);
        }
      }

      // Clear cookies
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      // Log logout event
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      console.log(`User logout: ${user?.email || 'unknown'} from ${clientIP}`);

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          message: 'Refresh token not found',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }

      // Call auth service to refresh token
      const refreshResult = await this.authService.refreshToken(refreshToken);

      // Set new access token cookie
      res.cookie('access_token', refreshResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          expiresIn: refreshResult.expiresIn
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  /**
   * Get current user data
   * GET /api/v1/auth/me
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user; // From auth middleware

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User data retrieved successfully',
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: user.role
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  /**
   * Verify access token
   * POST /api/v1/auth/verify-token
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      const accessToken = token || req.cookies.access_token;

      if (!accessToken) {
        const response: ApiResponse = {
          success: false,
          message: 'Access token not provided',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Verify token using JWT utilities
      const payload = await verifyAccessToken(accessToken);

      if (!payload) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Token is valid',
        data: {
          valid: true,
          payload: {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            exp: payload.exp
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      this.handleError(error, res, next);
    }
  };
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
