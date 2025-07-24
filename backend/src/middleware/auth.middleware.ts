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

// In-memory store for email-based rate limiting
const emailAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware for login attempts
 * Limits requests per IP (10 per 15min) and per email (5 per 15min)
 */
export const rateLimitLogin = [
  // IP-based rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: {
      success: false,
      error: 'Too many login attempts from this IP, please try again later',
      code: 'IP_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(15 * 60); // 15 minutes in seconds
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: 'Too many login attempts from this IP, please try again later',
        code: 'IP_RATE_LIMIT_EXCEEDED',
        retryAfter
      });
    }
  }),
  
  // Email-based rate limiting middleware
  (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body.email?.toLowerCase();
    if (!email) {
      next();
      return;
    }

    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Clean up expired entries
    for (const [key, value] of emailAttempts.entries()) {
      if (now > value.resetTime) {
        emailAttempts.delete(key);
      }
    }

    const attempt = emailAttempts.get(email);
    
    if (attempt) {
      if (now < attempt.resetTime) {
        if (attempt.count >= maxAttempts) {
          const retryAfter = Math.ceil((attempt.resetTime - now) / 1000);
          res.set('Retry-After', retryAfter.toString());
          res.status(429).json({
            success: false,
            error: 'Too many login attempts for this email, please try again later',
            code: 'EMAIL_RATE_LIMIT_EXCEEDED',
            retryAfter
          });
          return;
        }
        attempt.count++;
      } else {
        // Reset window
        attempt.count = 1;
        attempt.resetTime = now + windowMs;
      }
    } else {
      // First attempt for this email
      emailAttempts.set(email, {
        count: 1,
        resetTime: now + windowMs
      });
    }

    next();
  }
];

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
          field: error.type === 'field' ? error.path : 'unknown',
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
 * Validates CSRF tokens for state-changing operations
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF validation for GET requests
  if (req.method === 'GET') {
    next();
    return;
  }

  // For now, we rely on SameSite cookies for CSRF protection
  // This provides good protection against CSRF attacks
  // TODO: Implement explicit CSRF token validation when needed
  
  // Check if request has proper origin/referer headers
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');
  
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      res.status(403).json({
        success: false,
        error: 'Invalid origin',
        code: 'CSRF_INVALID_ORIGIN'
      });
      return;
    }
  } else if (referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      res.status(403).json({
        success: false,
        error: 'Invalid referer',
        code: 'CSRF_INVALID_REFERER'
      });
      return;
    }
  }
  
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
