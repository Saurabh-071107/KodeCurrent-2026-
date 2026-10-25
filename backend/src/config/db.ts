import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/draftmate';
  if (!process.env.MONGODB_URI) {
    console.warn('[MongoDB Warning] MONGODB_URI is not set in environment variables! Using default localhost fallback.');
  }
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    if (!process.env.MONGODB_URI || mongoUri.includes('127.0.0.1')) {
      console.error('[ACTION REQUIRED] Please set MONGODB_URI in Render dashboard Environment tab to your MongoDB Atlas connection string.');
    }
    throw error;
  }
};
