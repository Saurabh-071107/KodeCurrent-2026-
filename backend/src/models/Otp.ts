import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  mobile: string;
  otp: string;
  verified: boolean;
  expiresAt: Date;
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
    otp: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup after expiration
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = model<IOtp>('Otp', otpSchema);
