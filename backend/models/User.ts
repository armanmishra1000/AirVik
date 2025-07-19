import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// User interface
export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  country?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User schema
const userSchema = new mongoose.Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      trim: true,
      maxlength: 2,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt fields
  }
);

// Create index on email field
userSchema.index({ email: 1 });

// Create User model
const User = mongoose.model<IUser>('User', userSchema);

export default User;
