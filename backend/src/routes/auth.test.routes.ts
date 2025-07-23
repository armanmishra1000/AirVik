import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.get('/public', (req, res) => {
  res.json({ success: true, message: 'Public endpoint' });
});

// Protected route - requires authentication
router.get('/protected', authMiddleware.authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

// Admin route - requires admin role
router.get('/admin', 
  authMiddleware.authenticateToken,
  authMiddleware.requireRole('admin'),
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Admin access granted' 
    });
  }
);

// Test rate limiting
router.post('/login', 
  authMiddleware.loginRateLimit,
  (req, res) => {
    res.json({ success: true, message: 'Login attempt' });
  }
);

export default router;
