import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';

// Create router instance
const router = Router();
const authController = new AuthController();

// Rate limiting configurations
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour  
  max: 5, // 5 resend attempts per hour per IP
  message: {
    success: false,
    message: 'Too many verification email requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation rules for registration
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Validation rules for email verification
const verifyEmailValidation = [
  body('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid verification token format')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Verification token must be hexadecimal')
];

// Validation rules for resend verification
const resendVerificationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Validation rules for profile update
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Parameter validation for token verification
const tokenParamValidation = [
  param('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid verification token format')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Verification token must be hexadecimal')
];

/**
 * Authentication Routes
 * All routes are public unless marked otherwise
 */

// POST /api/v1/auth/register
router.post('/register', 
  registrationLimiter,
  registerValidation,
  authController.register
);

// POST /api/v1/auth/verify-email  
router.post('/verify-email',
  verifyEmailValidation,
  authController.verifyEmail
);

// GET /api/v1/auth/verify-email/:token (browser redirect)
router.get('/verify-email/:token',
  tokenParamValidation,
  authController.verifyEmailRedirect
);

// POST /api/v1/auth/resend-verification
router.post('/resend-verification',
  resendLimiter,
  resendVerificationValidation,
  authController.resendVerificationEmail
);

/**
 * User Profile Routes (require authentication)
 * TODO: Add authentication middleware
 */

// GET /api/v1/users/profile
router.get('/users/profile',
  // TODO: Add auth middleware: authenticateToken,
  authController.getUserProfile
);

// PUT /api/v1/users/profile
router.put('/users/profile',
  // TODO: Add auth middleware: authenticateToken,
  updateProfileValidation,
  authController.updateUserProfile
);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

export { router as authRoutes };

// TODO: Add authentication middleware for protected routes
// TODO: Add request logging middleware
// TODO: Add CORS configuration
// TODO: Add API versioning support
// TODO: Add OpenAPI/Swagger documentation generation
// TODO: Add request/response compression
// TODO: Add security headers middleware (helmet)
// TODO: Add input sanitization middleware
// TODO: Add request timeout handling
// TODO: Add metrics collection middleware
// TODO: Add admin routes for user management
// TODO: Add password reset routes
// TODO: Add account deletion routes
// TODO: Add two-factor authentication routes
