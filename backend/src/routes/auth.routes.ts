import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.middleware';

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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour per IP
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
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
    .matches(/^[\+]?[0-9]{7,15}$/)
    .withMessage('Please provide a valid phone number'),
    
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth in ISO format (YYYY-MM-DD)'),
    
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
    
  body('preferences.newsletter')
    .optional()
    .isBoolean()
    .withMessage('Newsletter preference must be a boolean'),
    
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean'),
    
  body('preferences.language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language preference must be a valid language code')
];

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for password reset request
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Validation rules for password reset
const resetPasswordValidation = [
  body('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid reset token format')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Reset token must be hexadecimal'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validation rules for password change
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validation rules for token refresh
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
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

// POST /api/v1/auth/login
router.post('/login',
  loginLimiter,
  loginValidation,
  authController.login
);

// POST /api/v1/auth/logout
router.post('/logout',
  authenticateToken,
  authController.logout
);

// POST /api/v1/auth/refresh
router.post('/refresh',
  refreshTokenValidation,
  authController.refreshToken
);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  authController.requestPasswordReset
);

// POST /api/v1/auth/reset-password
router.post('/reset-password',
  resetPasswordValidation,
  authController.resetPassword
);

/**
 * User Profile Routes (require authentication)
 */

// GET /api/v1/users/profile
router.get('/users/profile',
  authenticateToken,
  authController.getUserProfile
);

// PUT /api/v1/users/profile
router.put('/users/profile',
  authenticateToken,
  updateProfileValidation,
  authController.updateUserProfile
);

// PUT /api/v1/users/password
router.put('/users/password',
  authenticateToken,
  changePasswordValidation,
  authController.changePassword
);

/**
 * Admin Routes (require admin role)
 */

// GET /api/v1/admin/users
router.get('/admin/users',
  authenticateToken,
  requireRole('admin'),
  authController.getAllUsers
);

// GET /api/v1/admin/users/:id
router.get('/admin/users/:id',
  authenticateToken,
  requireRole('admin'),
  authController.getUserById
);

// PUT /api/v1/admin/users/:id
router.put('/admin/users/:id',
  authenticateToken,
  requireRole('admin'),
  authController.updateUserById
);

// DELETE /api/v1/admin/users/:id
router.delete('/admin/users/:id',
  authenticateToken,
  requireRole('admin'),
  authController.deleteAccount
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

// TODO: Add request logging middleware
// TODO: Add CORS configuration
// TODO: Add API versioning support
// TODO: Add OpenAPI/Swagger documentation generation
// TODO: Add request/response compression
// TODO: Add security headers middleware (helmet)
// TODO: Add input sanitization middleware
// TODO: Add request timeout handling
// TODO: Add metrics collection middleware
// TODO: Add two-factor authentication routes
