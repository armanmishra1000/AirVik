import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
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
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'refresh_tokens'
  }
);

// Index for automatic cleanup of expired tokens
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Compound index for efficient token lookup
refreshTokenSchema.index({
  token: 1,
  isRevoked: 1,
  expiresAt: 1
});

// Static method to generate secure refresh token
refreshTokenSchema.statics.generateToken = function(): string {
  // TODO: Implement cryptographically secure token generation
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url');
};

// Instance method to check if token is expired
refreshTokenSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if token is valid (not expired and not revoked)
refreshTokenSchema.methods.isValid = function(): boolean {
  return !this.isExpired() && !this.isRevoked;
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = function(): Promise<IRefreshToken> {
  this.isRevoked = true;
  return this.save();
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = function(userId: mongoose.Types.ObjectId): Promise<any> {
  return this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

export const RefreshToken = mongoose.model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema
);

// TODO: Add cleanup job for expired/revoked tokens
// TODO: Add rate limiting for token refresh
// TODO: Add device/session tracking
// TODO: Add suspicious activity detection
