import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

// User session interface for refresh token management
export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  refreshToken: string; // Store hashed version
  deviceInfo?: string; // User agent string
  ipAddress: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User session schema definition
const UserSessionSchema = new Schema<IUserSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  refreshToken: {
    type: String,
    required: [true, 'Refresh token is required'],
    unique: true,
    index: true
    // TODO: Store hashed version of token for security
  },
  
  deviceInfo: {
    type: String,
    trim: true,
    maxlength: [500, 'Device info cannot exceed 500 characters']
    // TODO: Parse user agent to get device/browser info
  },
  
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    validate: {
      validator: function(ip: string) {
        // IPv4 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        
        // IPv6 validation (including compressed forms like ::1)
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)*::[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)+::$/;
        
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
      },
      message: 'Please provide a valid IP address'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true
    // TODO: Set default expiry (7 days for normal, 30 days for rememberMe)
  }
}, {
  timestamps: true,
  collection: 'user_sessions'
});

// Indexes for performance
UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-cleanup expired sessions

// Instance methods
UserSessionSchema.methods = {
  // TODO: Method to check if session is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  },
  
  // TODO: Method to extend session expiry (for rememberMe)
  extendExpiry(days: number = 7): void {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
};

// Static methods
UserSessionSchema.statics = {
  // TODO: Method to cleanup expired sessions
  async cleanupExpired() {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
  },
  
  // TODO: Method to revoke all sessions for a user
  async revokeUserSessions(userId: mongoose.Types.ObjectId) {
    return this.updateMany({ userId }, { isActive: false });
  }
};

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);
export default UserSession;
