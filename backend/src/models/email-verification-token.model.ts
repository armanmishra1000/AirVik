import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
      default: 'email_verification'
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    usedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'email_verification_tokens'
  }
);

// Index for automatic cleanup of expired tokens
emailVerificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Compound index for efficient token lookup
emailVerificationTokenSchema.index({
  token: 1,
  type: 1,
  expiresAt: 1
});

// Static method to generate secure token
emailVerificationTokenSchema.statics.generateToken = function(): string {
  // TODO: Implement cryptographically secure token generation
  // Use crypto.randomBytes() and convert to URL-safe base64
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url');
};

// Instance method to check if token is expired
emailVerificationTokenSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if token is used
emailVerificationTokenSchema.methods.isUsed = function(): boolean {
  return this.usedAt !== null && this.usedAt !== undefined;
};

// Instance method to mark token as used
emailVerificationTokenSchema.methods.markAsUsed = function(): Promise<IEmailVerificationToken> {
  this.usedAt = new Date();
  return this.save();
};

// Pre-save validation
emailVerificationTokenSchema.pre('save', function(next) {
  // Ensure token expiration is in the future for new tokens
  if (this.isNew && this.expiresAt <= new Date()) {
    next(new Error('Token expiration must be in the future'));
    return;
  }
  
  next();
});

export const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  'EmailVerificationToken',
  emailVerificationTokenSchema
);

// TODO: Add cleanup job for expired tokens
// TODO: Add logging for token usage
// TODO: Add rate limiting for token generation
// TODO: Add token blacklisting functionality
