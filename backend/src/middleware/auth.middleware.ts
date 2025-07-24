import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, UserRole } from '../models/user.model';
import { authService } from '../services/auth.service';
import { RefreshToken } from '../models/refresh-token.model';

/**
 * JWT Configuration
 * Matches the configuration in auth.service.ts
 */
interface JwtConfig {
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
  SECRET: string;
  REFRESH_SECRET: string;
}

const JWT_CONFIG: JwtConfig = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'
} as const;

/**
 * Rate Limiting Configuration
 * Matches the configuration in auth.service.ts
 */
const RATE_LIMIT_CONFIG = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  REGISTRATION_ATTEMPTS: 3,
  REGISTRATION_WINDOW_MINUTES: 60,
  VERIFICATION_ATTEMPTS: 3,
  VERIFICATION_WINDOW_MINUTES: 60,
  PASSWORD_RESET_ATTEMPTS: 3,
  PASSWORD_RESET_WINDOW_MINUTES: 60,
  GENERAL_REQUESTS: 100,
  GENERAL_WINDOW_MINUTES: 15
};

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isEmailVerified: boolean;
        permissions?: string[];
      };
    }
  }
}

/**
 * JWT Payload Interface
 * Matches the JWTPayload interface in auth.service.ts
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

/**
 * JWT Token Validation Middleware
 * Validates access tokens and injects user data into request
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header or cookies
 * 2. Verifies token signature and expiration
 * 3. Checks if the user still exists and is active
 * 4. Injects user data into the request object
 * 5. Handles various token-related errors with appropriate responses
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    // Extract token from cookies as fallback
    const cookieToken = req.cookies?.accessToken;
    
    // Use token from header or cookie
    const accessToken = token || cookieToken;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    // Verify JWT token with secret
    const jwtSecret = JWT_CONFIG.SECRET;
    const decoded = jwt.verify(accessToken, jwtSecret) as JWTPayload;
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Calculate permissions based on role and verification status
    const permissions = calculatePermissions(decoded.role, decoded.isEmailVerified);

    // Inject user data into request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isEmailVerified: decoded.isEmailVerified,
      permissions
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // For all other errors, return a generic error
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTHENTICATION_ERROR'
    });
  }
};

/**
 * Token Refresh Middleware
 * Handles token refresh when access token is expired
 * 
 * This middleware:
 * 1. Is used when authenticateToken middleware returns TOKEN_EXPIRED
 * 2. Extracts refresh token from cookies or request body
 * 3. Validates the refresh token
 * 4. Generates a new access token
 * 5. Sets the new access token in cookies and returns it in response
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Extract refresh token from cookies or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }
    
    // Verify refresh token using auth service
    const { accessToken } = await authService.refreshToken(refreshToken);
    
    // Set new access token in cookie (if using cookies)
    if (req.cookies?.accessToken) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
    }
    
    // Return new access token
    res.status(200).json({
      success: true,
      data: { accessToken },
      message: 'Access token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role level
 * 
 * This middleware:
 * 1. Ensures user is authenticated
 * 2. Checks if user's role meets the minimum required role
 * 3. Uses role hierarchy (guest < customer < manager < admin)
 */
export const requireRole = (minRole: UserRole | string) => {
  const roleHierarchy: Record<string, number> = {
    'guest': 0,
    'customer': 1,
    'manager': 2,
    'admin': 3
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const userRoleLevel = roleHierarchy[req.user.role.toLowerCase()] ?? 0;
      const requiredRoleLevel = roleHierarchy[minRole.toLowerCase()] ?? 0;

      if (userRoleLevel < requiredRoleLevel) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR'
      });
      return;
    }
  };
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has specific permission
 * 
 * This middleware:
 * 1. Ensures user is authenticated
 * 2. Checks if user has the required permission
 * 3. Permissions are calculated based on role and verification status
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      if (!req.user.permissions?.includes(permission)) {
        res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`,
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Email Verification Required Middleware
 * Ensures user has verified their email address
 * 
 * This middleware:
 * 1. Ensures user is authenticated
 * 2. Checks if user's email is verified
 * 3. Returns appropriate error if not verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
    return;
  }

  next();
};

/**
 * Calculate user permissions based on role and verification status
 * 
 * @param role User role
 * @param isEmailVerified Email verification status
 * @returns Array of permission strings
 */
function calculatePermissions(role: UserRole | string, isEmailVerified: boolean): string[] {
  const permissions: string[] = ['authenticated'];
  
  // Add role-based permissions
  switch (role.toLowerCase()) {
    case 'admin':
      permissions.push('admin');
      permissions.push('manager');
      permissions.push('customer');
      break;
    case 'manager':
      permissions.push('manager');
      permissions.push('customer');
      break;
    case 'customer':
      permissions.push('customer');
      break;
  }
  
  // Add verification-based permissions
  if (isEmailVerified) {
    permissions.push('verified');
    permissions.push('booking'); // Booking features require verification
  }
  
  // Add profile access permission for all authenticated users
  permissions.push('profile');
  
  return permissions;
}

/**
 * Rate Limiting for Login Endpoints
 */
export const loginRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.LOGIN_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_CONFIG.LOGIN_ATTEMPTS,
  message: {
    success: false,
    error: `Too many login attempts. Please try again after ${RATE_LIMIT_CONFIG.LOGIN_WINDOW_MINUTES} minutes.`,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiting for Registration Endpoints
 */
export const registrationRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.REGISTRATION_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_CONFIG.REGISTRATION_ATTEMPTS,
  message: {
    success: false,
    error: `Too many registration attempts. Please try again after ${RATE_LIMIT_CONFIG.REGISTRATION_WINDOW_MINUTES} minutes.`,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiting for Email Verification Endpoints
 */
export const verificationRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.VERIFICATION_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_CONFIG.VERIFICATION_ATTEMPTS,
  message: {
    success: false,
    error: `Too many verification attempts. Please try again after ${RATE_LIMIT_CONFIG.VERIFICATION_WINDOW_MINUTES} minutes.`,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful verifications
});

/**
 * Rate Limiting for Password Reset Endpoints
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_CONFIG.PASSWORD_RESET_ATTEMPTS,
  message: {
    success: false,
    error: `Too many password reset attempts. Please try again after ${RATE_LIMIT_CONFIG.PASSWORD_RESET_WINDOW_MINUTES} minutes.`,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiting for General API Endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.GENERAL_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_CONFIG.GENERAL_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Request Logging Middleware
 * Logs API requests for monitoring and debugging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - Started - IP: ${ip} - UA: ${userAgent}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms - IP: ${ip}`
    );
  });
  
  next();
};

/**
 * Error Handler Middleware
 * Catches and formats errors from previous middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('API Error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

// Export a middleware collection for easy application to routes
export const authMiddleware = {
  authenticateToken,
  refreshAccessToken,
  requireRole,
  requirePermission,
  requireEmailVerification,
  loginRateLimit,
  registrationRateLimit,
  verificationRateLimit,
  passwordResetRateLimit,
  generalRateLimit,
  requestLogger,
  errorHandler
};
