# Production Deployment Guide: User Registration with Email Verification

## 🚀 Production Deployment Checklist

### Prerequisites
- [x] Node.js 18+ installed
- [x] MongoDB 6.0+ running
- [x] SendGrid account configured
- [x] Domain and SSL certificate ready
- [x] Environment variables prepared

### Deployment Steps

#### 1. Environment Configuration
Create `.env` file in backend directory:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/airvik_production

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=AirVik Hotel Booking

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=5

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
```

#### 2. Database Setup
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/airvik_production

# Create indexes (automatically handled by Mongoose)
# Verify User collection exists
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "emailVerificationToken": 1 }, { sparse: true })
db.users.createIndex({ "createdAt": -1 })
db.users.createIndex({ "status": 1, "createdAt": -1 })
```

#### 3. Backend Deployment
```bash
# Navigate to backend directory
cd backend

# Install production dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name "airvik-backend"
pm2 startup
pm2 save
```

#### 4. Frontend Deployment
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
# For Vercel: vercel --prod
# For Netlify: netlify deploy --prod
```

#### 5. Reverse Proxy Setup (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SendGrid Email Configuration

#### Email Templates Setup
1. Login to SendGrid Dashboard
2. Navigate to Email API > Dynamic Templates
3. Create templates for:
   - Email Verification
   - Welcome Email
   - Password Reset (future)

#### Email Verification Template
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - AirVik</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb;">Welcome to AirVik!</h1>
        <p>Thank you for registering with AirVik Hotel Booking System.</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="{{verificationUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>{{verificationUrl}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">AirVik Hotel Booking System</p>
    </div>
</body>
</html>
```

### 7. Health Checks & Monitoring

#### Health Check Endpoint
```bash
# Backend health check
curl https://yourdomain.com/api/v1/health

# Expected response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-07-22T12:51:43.000Z",
  "environment": "production"
}
```

#### Monitoring Setup
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 8. Security Hardening

#### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

#### SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Configure HSTS headers
- Enable OCSP stapling
- Use strong cipher suites

### 9. Backup Strategy

#### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/airvik_production" --out="/backups/mongodb_$DATE"
tar -czf "/backups/mongodb_$DATE.tar.gz" "/backups/mongodb_$DATE"
rm -rf "/backups/mongodb_$DATE"

# Keep only last 30 days of backups
find /backups -name "mongodb_*.tar.gz" -mtime +30 -delete
```

#### Automated Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### 10. Performance Optimization

#### Database Optimization
- Enable MongoDB profiling
- Monitor slow queries
- Optimize indexes based on usage patterns

#### Application Optimization
- Enable gzip compression
- Configure caching headers
- Use CDN for static assets
- Implement Redis for session storage (future)

### 11. Troubleshooting

#### Common Production Issues

**1. Email Verification Emails Not Sending**
```bash
# Check SendGrid API key
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Check backend logs
pm2 logs airvik-backend
```

**2. Database Connection Issues**
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/airvik_production

# Check MongoDB logs
sudo journalctl -u mongod
```

**3. High Memory Usage**
```bash
# Monitor application memory
pm2 monit

# Check system resources
htop
free -h
df -h
```

**4. Rate Limiting Issues**
```bash
# Check rate limiting logs
grep "rate limit" /var/log/nginx/access.log

# Adjust rate limits in environment variables
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=3600000
```

### 12. Maintenance Tasks

#### Daily Tasks
- Monitor error logs
- Check email delivery rates
- Verify backup completion

#### Weekly Tasks
- Review performance metrics
- Update security patches
- Clean up old logs

#### Monthly Tasks
- Update dependencies
- Review and rotate secrets
- Analyze user registration patterns
- Performance optimization review

### 13. Rollback Procedure

#### Quick Rollback
```bash
# Stop current version
pm2 stop airvik-backend

# Restore previous version
git checkout previous-stable-tag
npm run build
pm2 restart airvik-backend

# Verify rollback
curl https://yourdomain.com/api/v1/health
```

#### Database Rollback
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/airvik_production" /backups/mongodb_YYYYMMDD_HHMMSS/
```

## 🎯 Production Readiness Verification

### Final Checklist
- [x] All environment variables configured
- [x] Database indexes created
- [x] SSL certificate installed
- [x] Email service tested
- [x] Rate limiting configured
- [x] Monitoring setup complete
- [x] Backup strategy implemented
- [x] Health checks responding
- [x] Security hardening applied
- [x] Documentation complete

### Success Metrics
- Registration success rate: >95%
- Email verification rate: >80%
- API response time: <500ms
- Uptime: >99.9%
- Error rate: <1%

## 🚀 The User Registration with Email Verification feature is now PRODUCTION READY!

For support and maintenance, refer to:
- [Troubleshooting Guide](../troubleshooting/authentication-issues.md)
- [API Documentation](../api/authentication.md)
- [Feature Documentation](../features/user-registration-email-verification/)
