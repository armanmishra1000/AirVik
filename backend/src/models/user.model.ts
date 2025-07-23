import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// User role enum
export enum UserRole {
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

// User interface extending MongoDB Document
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  profileImage?: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    language: string;
  };
  metadata: {
    registrationIP?: string;
    userAgent?: string;
    source?: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  fullName: string;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema definition
const UserSchema = new Schema<IUser>(
  {
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
  
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // Optional field
        return /^[\+]?[0-9]{7,15}$/.test(phone);
      },
      message: 'Please provide a valid phone number (7-15 digits with optional country code)'
    }
  },
  
  dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
    preferences: {
      newsletter: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
    metadata: {
      registrationIP: String,
      userAgent: String,
      source: String,
    },
  
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret: Record<string, any>) {
      // Remove sensitive fields from JSON output
      const { password, loginAttempts, lockoutUntil, __v, ...safeRet } = ret;
      return safeRet;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isEmailVerified: 1, isActive: 1 });

// Virtual field for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook for password hashing
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash password if it's modified or new
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
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
UserSchema.methods.generateEmailVerificationToken = async function(): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  return token;
};

// Instance method to check if account is locked
UserSchema.methods.isAccountLocked = function(): boolean {
  return this.lockoutUntil && new Date() < this.lockoutUntil;
};

// Create and export the User model
export const User = mongoose.model<IUser>('User', UserSchema);

// No need to re-export IUser as it's already exported above
