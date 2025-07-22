import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { IUser } from '../models/user.model';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email template data interface
interface TemplateData {
  [key: string]: string | number | boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  
  constructor() {
    // TODO: Load email configuration from environment variables
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.FROM_EMAIL || 'noreply@hotel.com'
    };
    
    this.initializeTransporter();
  }
  
  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter(): void {
    try {
      // TODO: Create nodemailer transporter with configuration
      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass
        }
      });
      
      // TODO: Verify transporter connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email service ready');
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }
  
  /**
   * Send email verification message to new user
   */
  async sendVerificationEmail(user: IUser, verificationToken: string): Promise<void> {
    try {
      // TODO: Generate verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify/${verificationToken}`;
      const apiVerificationUrl = `${process.env.API_URL}/api/v1/auth/verify-email/${verificationToken}`;
      
      // TODO: Load and render email template
      const htmlContent = await this.renderTemplate('welcome-verification', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verificationUrl: verificationUrl,
        apiVerificationUrl: apiVerificationUrl,
        expiresIn: '24 hours',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@hotel.com',
        hotelName: process.env.HOTEL_NAME || 'AirVik Hotel',
        currentYear: new Date().getFullYear().toString()
      });
      
      // TODO: Generate plain text version
      const textContent = await this.renderTemplate('welcome-verification', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verificationUrl: verificationUrl,
        apiVerificationUrl: apiVerificationUrl,
        expiresIn: '24 hours',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@hotel.com',
        hotelName: process.env.HOTEL_NAME || 'AirVik Hotel'
      }, 'txt');
      
      // TODO: Send email
      const mailOptions = {
        from: {
          name: process.env.HOTEL_NAME || 'AirVik Hotel',
          address: this.config.from
        },
        to: user.email,
        subject: 'Welcome! Please verify your email address',
        html: htmlContent,
        text: textContent
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      // TODO: Log email sent
      console.log(`Verification email sent to ${user.email}:`, info.messageId);
      
    } catch (error) {
      // TODO: Implement email error handling with retries
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
  
  /**
   * Send confirmation email after successful verification
   */
  async sendVerificationSuccessEmail(user: IUser): Promise<void> {
    try {
      // TODO: Load and render success email template
      const htmlContent = await this.renderTemplate('verification-success', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        profileUrl: `${process.env.FRONTEND_URL}/profile`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@hotel.com',
        hotelName: process.env.HOTEL_NAME || 'AirVik Hotel',
        currentYear: new Date().getFullYear().toString()
      });
      
      const textContent = await this.renderTemplate('verification-success', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        profileUrl: `${process.env.FRONTEND_URL}/profile`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@hotel.com',
        hotelName: process.env.HOTEL_NAME || 'AirVik Hotel'
      }, 'txt');
      
      // TODO: Send confirmation email
      const mailOptions = {
        from: {
          name: process.env.HOTEL_NAME || 'AirVik Hotel',
          address: this.config.from
        },
        to: user.email,
        subject: 'Email verified successfully - Welcome to AirVik!',
        html: htmlContent,
        text: textContent
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      // TODO: Log email sent
      console.log(`Success email sent to ${user.email}:`, info.messageId);
      
    } catch (error) {
      // TODO: Implement email error handling (non-critical)
      console.error('Failed to send success email:', error);
      // Don't throw error as this is not critical
    }
  }
  
  /**
   * Render email template with data
   */
  private async renderTemplate(templateName: string, data: TemplateData, extension: string = 'html'): Promise<string> {
    try {
      // TODO: Load template file
      const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.${extension}`);
      
      if (!fs.existsSync(templatePath)) {
        // TODO: Return fallback template if file doesn't exist
        return this.getFallbackTemplate(templateName, data, extension);
      }
      
      let template = fs.readFileSync(templatePath, 'utf8');
      
      // TODO: Replace template variables with actual data
      Object.keys(data).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(placeholder, String(data[key]));
      });
      
      return template;
      
    } catch (error) {
      console.error(`Failed to render template ${templateName}:`, error);
      return this.getFallbackTemplate(templateName, data, extension);
    }
  }
  
  /**
   * Get fallback template when file template is not available
   */
  private getFallbackTemplate(templateName: string, data: TemplateData, extension: string): string {
    if (templateName === 'welcome-verification') {
      if (extension === 'html') {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { display: inline-block; background: #007bff; color: white; 
                       padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                       margin: 20px 0; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ${data.hotelName}</h1>
              </div>
              <div class="content">
                <h2>Hi ${data.firstName},</h2>
                <p>Thank you for registering with ${data.hotelName}! To complete your registration and start booking rooms, please verify your email address.</p>
                <p><a href="${data.verificationUrl}" class="button">Verify Email Address</a></p>
                <p>Or copy and paste this link in your browser:</p>
                <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
                <p>This verification link will expire in ${data.expiresIn}.</p>
                <p>If you didn't create an account with us, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>Need help? Contact us at ${data.supportEmail}</p>
                <p>&copy; ${data.currentYear} ${data.hotelName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        return `
Welcome to ${data.hotelName}!

Hi ${data.firstName},

Thank you for registering with ${data.hotelName}! To complete your registration and start booking rooms, please verify your email address.

Verification Link: ${data.verificationUrl}

This verification link will expire in ${data.expiresIn}.

If you didn't create an account with us, please ignore this email.

Need help? Contact us at ${data.supportEmail}

© ${data.currentYear} ${data.hotelName}. All rights reserved.
        `;
      }
    }
    
    if (templateName === 'verification-success') {
      if (extension === 'html') {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Email Verified Successfully</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #28a745; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { display: inline-block; background: #007bff; color: white; 
                       padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                       margin: 10px 5px; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Email Verified!</h1>
              </div>
              <div class="content">
                <h2>Welcome, ${data.firstName}!</h2>
                <p>Your email address has been successfully verified. Your account is now active and you can start booking rooms at ${data.hotelName}.</p>
                <p>
                  <a href="${data.loginUrl}" class="button">Log In Now</a>
                  <a href="${data.profileUrl}" class="button">View Profile</a>
                </p>
                <p>Thank you for choosing ${data.hotelName}. We look forward to hosting your stay!</p>
              </div>
              <div class="footer">
                <p>Need help? Contact us at ${data.supportEmail}</p>
                <p>&copy; ${data.currentYear} ${data.hotelName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        return `
Email Verified Successfully!

Welcome, ${data.firstName}!

Your email address has been successfully verified. Your account is now active and you can start booking rooms at ${data.hotelName}.

Log in now: ${data.loginUrl}
View your profile: ${data.profileUrl}

Thank you for choosing ${data.hotelName}. We look forward to hosting your stay!

Need help? Contact us at ${data.supportEmail}

© ${data.currentYear} ${data.hotelName}. All rights reserved.
        `;
      }
    }
    
    // Default fallback
    return 'Email template not found';
  }
  
  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // TODO: Verify email service is working
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}

// TODO: Add email template files in backend/src/templates/
// TODO: Add email delivery status tracking
// TODO: Add email bounce handling
// TODO: Add email unsubscribe functionality
// TODO: Add email analytics and open tracking
// TODO: Add support for multiple email providers
// TODO: Add email queue for better reliability
// TODO: Add email template versioning
// TODO: Add A/B testing for email templates
// TODO: Add internationalization for email content
