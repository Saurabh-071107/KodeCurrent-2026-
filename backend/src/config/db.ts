import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const rawUri = (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  const mongoUri = rawUri || 'mongodb://127.0.0.1:27017/draftmate';
  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

  console.log(`[MongoDB] Initializing connection to: ${maskedUri}`);

  if (!rawUri || mongoUri.includes('127.0.0.1')) {
    console.warn('[MongoDB Warning] No valid external MONGODB_URI detected! Currently targeting localhost (127.0.0.1). If you are on Render, you MUST configure MONGODB_URI in the Environment tab.');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${mongoose.connection.host}, database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    if (!rawUri || mongoUri.includes('127.0.0.1')) {
      console.error('[ACTION REQUIRED] Please add MONGODB_URI to Render Dashboard -> TeamNexorabackend -> Environment tab with your MongoDB Atlas string.');
    }
    throw error;
  }
};
