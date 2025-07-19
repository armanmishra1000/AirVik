import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Room interface
export interface IRoom {
  _id: string;
  name: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Room schema
const roomSchema = new mongoose.Schema<IRoom>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt fields
  }
);

// Create index on price for faster queries
roomSchema.index({ pricePerNight: 1 });
roomSchema.index({ capacity: 1 });

// Create Room model
const Room = mongoose.model<IRoom>('Room', roomSchema);

export default Room;
