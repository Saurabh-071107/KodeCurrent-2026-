import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOnboardingData {
  completed: boolean;
  role?: string;
  enrollmentId?: string;
  practiceAreas?: string[];
  experience?: string;
  collegeName?: string;
  academicYear?: string;
  firmName?: string;
  firmPosition?: string;
  firmSize?: string;
  legalNeed?: string;
  industry?: string;
  completedAt?: Date;
}

export interface ITtsPreferences {
  voice?: string;
  rate?: number;
  pitch?: number;
  preferredLanguage?: string;
  autoScrollHighlight?: boolean;
}

export interface IUser extends Document {
  mobile: string;
  name: string;
  password?: string;
  role: string;
  isVerified: boolean;
  onboarding?: IOnboardingData;
  ttsPreferences?: ITtsPreferences;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    onboarding: {
      completed: { type: Boolean, default: false },
      role: { type: String },
      enrollmentId: { type: String },
      practiceAreas: [{ type: String }],
      experience: { type: String },
      collegeName: { type: String },
      academicYear: { type: String },
      firmName: { type: String },
      firmPosition: { type: String },
      firmSize: { type: String },
      legalNeed: { type: String },
      industry: { type: String },
      completedAt: { type: Date },
    },
    ttsPreferences: {
      voice: { type: String, default: '' },
      rate: { type: Number, default: 1.0 },
      pitch: { type: Number, default: 1.0 },
      preferredLanguage: { type: String, default: 'en-IN' },
      autoScrollHighlight: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
export default User;
