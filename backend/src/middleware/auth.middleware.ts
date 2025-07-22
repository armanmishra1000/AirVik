import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.util';
import { User } from '../models/user.model';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        id: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT access token
 * Checks Authorization header or access_token cookie
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    // TODO: Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token not provided',
        code: 'TOKEN_MISSING'
      });
      return;
    }
    
    // TODO: Verify token and check blacklist
    const payload = await verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired access token',
        code: 'TOKEN_INVALID'
      });
      return;
    }
    
    // TODO: Validate user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'verified') {
      res.status(401).json({
        success: false,
        error: 'User account not found or not verified',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
    
    // Add user data to request object
    req.user = {
      ...payload,
      id: payload.userId
    };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Rate limiting middleware for login attempts
 * Limits requests per IP and per email
 */
export const rateLimitLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for login
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // TODO: Implement per-email rate limiting (5 attempts per email per 15 min)
  keyGenerator: (req: Request): string => {
    // Rate limit by IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * Validation middleware for login request
 */
export const validateLoginRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value'),
  
  // Middleware to handle validation errors
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      });
      return;
    }
    next();
  }
];

/**
 * CSRF protection middleware
 * TODO: Implement CSRF token validation for state-changing operations
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // TODO: Implement CSRF token validation
  // For now, just pass through - implement when frontend sends CSRF tokens
  next();
};

/**
 * Security logging middleware for authentication events
 */
export const logAuthEvent = (eventType: 'login_success' | 'login_fail' | 'logout') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement security event logging
    const logData = {
      eventType,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      email: req.body?.email || req.user?.email,
      userId: req.user?.userId
    };
    
    console.log('Auth Event:', logData);
    // TODO: Send to proper logging service (e.g., Winston, external logging service)
    
    next();
  };
};

/**
 * Middleware to require specific user roles
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    // TODO: Check if user role is in required roles
    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Sets user data if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    
    if (token) {
      // TODO: Verify token without failing if invalid
      const payload = await verifyAccessToken(token);
      if (payload) {
        const user = await User.findById(payload.userId);
        if (user && user.status === 'verified') {
          req.user = {
            ...payload,
            id: payload.userId
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors, just proceed without user
    next();
  }
};
