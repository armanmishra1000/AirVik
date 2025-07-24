import mongoose, { Document, Schema } from 'mongoose';

// Blacklisted token interface for JWT token invalidation
export interface IBlacklistedToken extends Document {
  token: string; // Store hashed version of the JWT token
  expiresAt: Date; // Original token expiration time
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
export interface IBlacklistedTokenModel extends mongoose.Model<IBlacklistedToken> {
  blacklistToken(token: string, expiresAt: Date): Promise<IBlacklistedToken>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  cleanupExpired(): Promise<any>;
}

// Blacklisted token schema definition
const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
    // TODO: Store hashed version of token for security and space efficiency
  },
  
  expiresAt: {
    type: Date,
    required: [true, 'Token expiration date is required'],
    index: true
    // TODO: Set this to original token expiry time for automatic cleanup
  }
}, {
  timestamps: true,
  collection: 'blacklisted_tokens'
});

// Auto-cleanup expired blacklisted tokens using MongoDB TTL index
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
BlacklistedTokenSchema.statics.blacklistToken = async function(token: string, expiresAt: Date): Promise<IBlacklistedToken> {
  // Hash the token before storing for security
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.create({
    token: hashedToken,
    expiresAt
  });
};

BlacklistedTokenSchema.statics.isTokenBlacklisted = async function(token: string): Promise<boolean> {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const blacklistedToken = await this.findOne({ 
    token: hashedToken,
    expiresAt: { $gt: new Date() } // Only check non-expired blacklist entries
  });
  
  return !!blacklistedToken;
};

BlacklistedTokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const BlacklistedToken = mongoose.model<IBlacklistedToken, IBlacklistedTokenModel>('BlacklistedToken', BlacklistedTokenSchema);
export default BlacklistedToken;
