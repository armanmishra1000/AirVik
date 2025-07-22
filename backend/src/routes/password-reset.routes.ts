import { Router } from 'express';
import { 
  requestPasswordReset, 
  verifyResetToken, 
  confirmPasswordReset, 
  getResetStatus 
} from '../controllers/password-reset.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { passwordResetLimiter } from '../middleware/password-reset-limiter.middleware';

const router = Router();

/**
 * POST /api/v1/auth/password-reset/request
 * Request a password reset token
 */
router.post('/request',
  // TODO: Add input validation middleware
  // validateRequest(passwordResetRequestSchema),
  
  // TODO: Add rate limiting middleware
  // passwordResetLimiter.emailLimiter,
  // passwordResetLimiter.ipLimiter,
  
  requestPasswordReset
);

/**
 * GET /api/v1/auth/password-reset/verify
 * Verify a reset token is valid
 */
router.get('/verify',
  // TODO: Add rate limiting middleware
  // passwordResetLimiter.verifyLimiter,
  
  verifyResetToken
);

/**
 * POST /api/v1/auth/password-reset/confirm
 * Complete password reset with new password
 */
router.post('/confirm',
  // TODO: Add input validation middleware
  // validateRequest(passwordResetConfirmSchema),
  
  // TODO: Add CSRF protection
  // csrfProtection,
  
  // TODO: Add rate limiting middleware
  // passwordResetLimiter.confirmLimiter,
  
  confirmPasswordReset
);

/**
 * GET /api/v1/auth/password-reset/status
 * Get password reset activity logs (Admin only)
 */
router.get('/status',
  authenticateToken,
  requireAdmin,
  getResetStatus
);

export default router;

// TODO: Integration with main app routes
// Add to backend/src/app.ts or backend/src/routes/index.ts:
/*
import passwordResetRoutes from './routes/password-reset.routes';
app.use('/api/v1/auth/password-reset', passwordResetRoutes);
*/
