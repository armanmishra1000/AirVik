import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isEmailVerified: boolean;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  iat: number;
  exp: number;
}

/**
 * JWT Token Validation Middleware
 * Validates access tokens and injects user data into request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    // TODO: Verify JWT token with secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // TODO: Verify user still exists and is active
    // const user = await User.findById(decoded.userId);
    // if (!user || !user.isActive) {
    //   throw new Error('User not found or inactive');
    // }

    // Inject user data into request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isEmailVerified: decoded.isEmailVerified
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid access token',
        code: 'TOKEN_INVALID'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED'
      });
    }
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role level
 */
export const requireRole = (minRole: string) => {
  const roleHierarchy = {
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

      const userRoleLevel = roleHierarchy[req.user.role as keyof typeof roleHierarchy] ?? 0;
      const requiredRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] ?? 0;

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
      res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Email Verification Required Middleware
 * Ensures user has verified their email address
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
    res.status(401).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
    return;
  }

  next();
};

/**
 * Rate Limiting for Authentication Endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiting for General API Endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// TODO: Add request logging middleware
// TODO: Add CSRF protection middleware
// TODO: Add IP-based blocking for suspicious activity
// TODO: Add device/session tracking
// TODO: Add audit logging for sensitive operations
