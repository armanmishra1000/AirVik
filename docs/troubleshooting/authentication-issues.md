# Troubleshooting Guide: User Registration & Email Verification

## 🔧 Common Issues & Solutions

### 1. Registration Issues

#### Registration API Returns 400 Error
**Symptoms:**
- Frontend shows "Registration failed" message
- Network tab shows 400 status code
- Backend logs show validation errors

**Causes & Solutions:**
```bash
# Check request payload format
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe", 
  "phoneNumber": "+1 (555) 123-4567", // Optional
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "agreedToTerms": true
}

# Common validation errors:
- Email format invalid
- Password too weak (min 8 chars, uppercase, lowercase, number)
- Names contain non-alphabetic characters
- Terms not agreed to
- Password confirmation mismatch
```

**Debug Steps:**
1. Check backend logs: `pm2 logs airvik-backend`
2. Verify request body in Network tab
3. Test with curl:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe","password":"TestPass123!","confirmPassword":"TestPass123!","agreedToTerms":true}'
```

#### Duplicate Email Error
**Symptoms:**
- Error message: "Email already exists"
- 409 status code returned

**Solutions:**
1. Check if user already exists in database
2. Implement "Forgot Password" flow for existing users
3. Clear test data if in development:
```bash
mongosh
use airvik
db.users.deleteOne({email: "test@example.com"})
```

### 2. Email Verification Issues

#### Verification Emails Not Sending
**Symptoms:**
- User registers successfully but no email received
- Check spam/junk folders

**Causes & Solutions:**

**SendGrid API Key Issues:**
```bash
# Test SendGrid API key
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Test message"}]
  }'
```

**Environment Variables:**
```bash
# Verify these are set correctly
echo $SENDGRID_API_KEY
echo $SENDGRID_FROM_EMAIL
echo $SENDGRID_FROM_NAME
```

**Email Service Debug:**
```javascript
// Add to email service for debugging
console.log('Sending email to:', email);
console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY);
console.log('From email:', process.env.SENDGRID_FROM_EMAIL);
```

#### Email Verification Token Expired
**Symptoms:**
- "Token has expired" error message
- User clicks verification link after 24 hours

**Solutions:**
1. Implement resend verification email functionality
2. Extend token expiration if needed:
```javascript
// In user.model.ts
emailVerificationTokenExpires: {
  type: Date,
  default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours instead of 24
}
```

#### Invalid Verification Token
**Symptoms:**
- "Invalid verification token" error
- Token not found in database

**Debug Steps:**
1. Check if token exists in database:
```bash
mongosh
use airvik
db.users.findOne({emailVerificationToken: "token-from-url"})
```

2. Verify token format in email template
3. Check for URL encoding issues

### 3. Authentication Issues

#### JWT Token Expiration
**Symptoms:**
- User logged out unexpectedly
- "Token expired" errors
- 401 Unauthorized responses

**Solutions:**
1. Implement refresh token logic
2. Adjust token expiration times:
```bash
# In .env file
JWT_EXPIRES_IN=30m  # Increase from 15m
JWT_REFRESH_EXPIRES_IN=30d  # Increase from 7d
```

3. Add token refresh logic to frontend:
```javascript
// In auth service
const refreshToken = async () => {
  try {
    const response = await axios.post('/api/v1/auth/refresh');
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

#### Session Management Issues
**Symptoms:**
- User state not persisting across page refreshes
- Authentication context not working

**Solutions:**
1. Check localStorage/sessionStorage:
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

2. Verify AuthContext provider wraps app:
```jsx
// In app layout
<AuthProvider>
  <Component {...pageProps} />
</AuthProvider>
```

### 4. Database Issues

#### MongoDB Connection Failed
**Symptoms:**
- "Database connection failed" errors
- Server won't start

**Solutions:**
1. Check MongoDB service:
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

2. Verify connection string:
```bash
# Test connection
mongosh mongodb://localhost:27017/airvik
```

3. Check network connectivity and firewall rules

#### User Schema Validation Errors
**Symptoms:**
- Mongoose validation errors
- Data not saving to database

**Debug Steps:**
1. Check schema validation rules in `user.model.ts`
2. Verify data types match schema
3. Test with minimal valid data

### 5. Rate Limiting Issues

#### Rate Limit Exceeded
**Symptoms:**
- "Too many requests" error (429 status)
- Users blocked from registration/verification

**Solutions:**
1. Adjust rate limiting settings:
```bash
# In .env file
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_MAX_REQUESTS=10    # Increase from 5
```

2. Implement IP whitelisting for testing:
```javascript
// In rate limiting middleware
const whitelist = ['127.0.0.1', '::1']; // localhost
if (whitelist.includes(req.ip)) {
  return next();
}
```

3. Clear rate limit cache:
```bash
# If using Redis
redis-cli FLUSHALL

# If using memory store, restart server
pm2 restart airvik-backend
```

### 6. Frontend Issues

#### Form Validation Not Working
**Symptoms:**
- Invalid data submitted
- No validation error messages

**Debug Steps:**
1. Check validation utility functions
2. Verify form state management
3. Test validation logic:
```javascript
// In browser console
import { validateEmail, validatePassword } from './utils/validation';
console.log(validateEmail('test@example.com'));
console.log(validatePassword('weak'));
```

#### API Calls Failing
**Symptoms:**
- Network errors in browser console
- CORS errors
- API endpoints not reachable

**Solutions:**
1. Check API base URL configuration
2. Verify CORS settings in backend:
```javascript
// In server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

3. Test API endpoints directly:
```bash
curl -X GET http://localhost:5000/api/v1/health
```

### 7. Performance Issues

#### Slow API Response Times
**Symptoms:**
- Registration takes >2 seconds
- Poor user experience

**Solutions:**
1. Add database indexes:
```javascript
// Check existing indexes
db.users.getIndexes()

// Add missing indexes
db.users.createIndex({email: 1}, {unique: true})
db.users.createIndex({emailVerificationToken: 1}, {sparse: true})
```

2. Optimize password hashing:
```javascript
// Reduce bcrypt rounds for development
const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 8;
```

3. Enable compression:
```javascript
// In server.ts
import compression from 'compression';
app.use(compression());
```

#### Memory Leaks
**Symptoms:**
- Increasing memory usage over time
- Server crashes with out of memory errors

**Debug Steps:**
1. Monitor memory usage:
```bash
pm2 monit
```

2. Check for unclosed database connections
3. Review event listeners and timers

### 8. Security Issues

#### Password Security Concerns
**Solutions:**
1. Verify bcrypt salt rounds:
```javascript
// Should be 12+ for production
const saltRounds = 12;
```

2. Implement password strength requirements
3. Add rate limiting to prevent brute force attacks

#### Token Security
**Solutions:**
1. Use httpOnly cookies for token storage:
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});
```

2. Implement token rotation
3. Add CSRF protection

## 🚨 Emergency Procedures

### Complete System Reset (Development Only)
```bash
# Stop all services
pm2 stop all

# Clear database
mongosh
use airvik
db.users.deleteMany({})

# Clear logs
pm2 flush

# Restart services
pm2 restart all
```

### Rollback to Previous Version
```bash
# Stop current version
pm2 stop airvik-backend

# Checkout previous stable version
git checkout previous-stable-tag

# Rebuild and restart
npm run build
pm2 restart airvik-backend
```

## 📞 Getting Help

### Log Collection
Before reporting issues, collect these logs:
```bash
# Backend logs
pm2 logs airvik-backend --lines 100

# MongoDB logs
sudo journalctl -u mongod --lines 50

# Nginx logs (if using)
sudo tail -f /var/log/nginx/error.log
```

### Debug Information Template
```
**Environment:**
- Node.js version: 
- MongoDB version:
- Operating System:
- Browser (if frontend issue):

**Issue Description:**
[Describe the problem]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Messages:**
[Include full error messages and stack traces]

**Additional Context:**
[Any other relevant information]
```

## 🔍 Monitoring & Alerts

### Key Metrics to Monitor
- Registration success rate (target: >95%)
- Email verification completion rate (target: >80%)
- API response times (target: <500ms)
- Error rates (target: <1%)
- Database connection health

### Alert Thresholds
- Error rate >5% for 5 minutes
- Response time >1000ms for 5 minutes
- Registration success rate <90% for 10 minutes
- Database connection failures

For additional support, refer to:
- [Production Deployment Guide](../deployment/production-setup.md)
- [API Documentation](../api/authentication.md)
- [Feature Documentation](../features/user-registration-email-verification/)
