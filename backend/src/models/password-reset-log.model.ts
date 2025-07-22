import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordResetLog extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  action: 'REQUEST' | 'ATTEMPT' | 'SUCCESS' | 'FAILURE' | 'EXPIRED';
  ip: string;
  userAgent?: string;
  tokenHash?: string;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetLogSchema = new Schema<IPasswordResetLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // TODO: Add index for faster queries by user
      index: true,
    },
    
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // TODO: Add validation for email format
      validate: {
        validator: function(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format'
      }
    },
    
    action: {
      type: String,
      required: true,
      enum: ['REQUEST', 'ATTEMPT', 'SUCCESS', 'FAILURE', 'EXPIRED'],
      // TODO: Add index for filtering by action type
      index: true,
    },
    
    ip: {
      type: String,
      required: true,
      // TODO: Add validation for IP address format
      validate: {
        validator: function(ip: string) {
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
          const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'unknown';
        },
        message: 'Invalid IP address format'
      },
      // TODO: Add index for IP-based queries
      index: true,
    },
    
    userAgent: {
      type: String,
      default: 'unknown',
      // TODO: Limit length to prevent abuse
      maxlength: 500,
    },
    
    tokenHash: {
      type: String,
      // TODO: Store hashed version of token for security
      // Used for matching log entries to specific reset attempts
    },
    
    errorMessage: {
      type: String,
      // TODO: Store error details for failed attempts
      maxlength: 1000,
    },
    
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      // TODO: Add index for time-based queries
      index: true,
    },
    
    completedAt: {
      type: Date,
      // TODO: Set when action is completed (success or failure)
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    
    // TODO: Add indexes for common query patterns
    indexes: [
      { userId: 1, requestedAt: -1 }, // User activity by date
      { ip: 1, requestedAt: -1 }, // IP activity by date
      { email: 1, action: 1, requestedAt: -1 }, // Email activity by action and date
    ],
  }
);

// TODO: Add static methods for common queries
PasswordResetLogSchema.statics = {
  /**
   * Find recent reset attempts for rate limiting
   */
  async findRecentAttempts(email: string, hours: number = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
      email,
      action: 'REQUEST',
      requestedAt: { $gte: since }
    });
  },

  /**
   * Find recent attempts by IP for rate limiting
   */
  async findRecentAttemptsByIP(ip: string, hours: number = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
      ip,
      action: 'REQUEST',
      requestedAt: { $gte: since }
    });
  },

  /**
   * Get password reset statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const match: any = {};
    if (startDate) match.requestedAt = { $gte: startDate };
    if (endDate) match.requestedAt = { ...match.requestedAt, $lte: endDate };

    return this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
  },
};

// TODO: Add instance methods
PasswordResetLogSchema.methods = {
  /**
   * Mark log entry as completed
   */
  markCompleted(errorMessage?: string) {
    this.completedAt = new Date();
    if (errorMessage) {
      this.errorMessage = errorMessage;
      this.action = 'FAILURE';
    }
    return this.save();
  },
};

// TODO: Add pre-save hooks for data validation
PasswordResetLogSchema.pre('save', function(next) {
  // TODO: Validate that completedAt is after requestedAt
  if (this.completedAt && this.completedAt < this.requestedAt) {
    next(new Error('completedAt must be after requestedAt'));
    return;
  }

  // TODO: Ensure required fields for different actions
  if (this.action === 'FAILURE' && !this.errorMessage) {
    next(new Error('errorMessage required for FAILURE action'));
    return;
  }

  next();
});

// TODO: Add post-save hooks for cleanup
PasswordResetLogSchema.post('save', async function() {
  // TODO: Implement automatic cleanup of old log entries
  // Keep logs for 90 days for security auditing
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // TODO: Run cleanup occasionally (not on every save)
  if (Math.random() < 0.001) { // 0.1% chance
    await mongoose.model('PasswordResetLog').deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    });
  }
});

// TODO: Create and export the model
const PasswordResetLog: Model<IPasswordResetLog> = mongoose.model<IPasswordResetLog>('PasswordResetLog', PasswordResetLogSchema);

export { PasswordResetLog };
