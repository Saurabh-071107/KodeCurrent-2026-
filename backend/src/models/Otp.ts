import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  mobile: string;
  otpHash: string;
  verified: boolean;
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  expiresAt: Date;
  lastRequestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup after expiration
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = model<IOtp>('Otp', otpSchema);
