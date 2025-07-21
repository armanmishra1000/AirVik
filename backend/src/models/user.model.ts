import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// User status enum
export enum UserStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended'
}

// User interface extending MongoDB Document
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: UserStatus;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  emailVerificationTokenRequestCount: number;
  lastEmailVerificationTokenRequest?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Virtual fields
  fullName: string;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  isEmailVerificationTokenValid(token: string): boolean;
}

// User schema definition
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        // TODO: Implement email format validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    },
    index: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password: string) {
        // TODO: Implement password strength validation
        // Must contain uppercase, lowercase, and number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function(name: string) {
        // TODO: Implement alphabetic validation
        return /^[a-zA-Z\s]+$/.test(name);
      },
      message: 'First name must contain only letters'
    }
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: {
      validator: function(name: string) {
        // TODO: Implement alphabetic validation
        return /^[a-zA-Z\s]+$/.test(name);
      },
      message: 'Last name must contain only letters'
    }
  },
  
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        // TODO: Implement phone number format validation
        if (!phone) return true; // Optional field
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.UNVERIFIED,
    index: true
  },
  
  emailVerificationToken: {
    type: String,
    sparse: true,
    index: true
  },
  
  emailVerificationTokenExpires: {
    type: Date
  },
  
  emailVerificationTokenRequestCount: {
    type: Number,
    default: 0
  },
  
  lastEmailVerificationTokenRequest: {
    type: Date
  },
  
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // TODO: Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ status: 1, createdAt: -1 });

// Virtual field for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook for password hashing
UserSchema.pre<IUser>('save', async function(next) {
  // TODO: Implement password hashing logic
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // TODO: Implement password comparison using bcrypt
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
UserSchema.methods.generateEmailVerificationToken = function(): string {
  // TODO: Implement secure token generation using crypto.randomBytes
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Instance method to validate email verification token
UserSchema.methods.isEmailVerificationTokenValid = function(token: string): boolean {
  // TODO: Implement token validation logic
  return (
    this.emailVerificationToken === token &&
    this.emailVerificationTokenExpires &&
    this.emailVerificationTokenExpires > new Date()
  );
};

// Create and export the User model
export const User = mongoose.model<IUser>('User', UserSchema);

// TODO: Add database connection setup
// TODO: Add database migration scripts for indexes
// TODO: Add user data seeding for development
// TODO: Add schema versioning for future updates
