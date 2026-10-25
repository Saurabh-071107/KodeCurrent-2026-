import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import appRoutes from './routes/app.routes';
import { seedInitialDatabase } from './services/data.service';
import { requestIdMiddleware, AppRequest } from './middleware/requestId.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Request correlation ID & headers
app.use(requestIdMiddleware);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'DraftMate Node Application API'
    },
    requestId: (req as AppRequest).id
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', appRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    requestId: (req as AppRequest).id
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error',
    },
    requestId: (req as AppRequest).id
  });
});

// Start Server
const startServer = async () => {
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[DraftMate Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Auth API] Available at /api/auth`);
    console.log(`[App API] Available at /api`);
  });

  try {
    await connectDB();
    await seedInitialDatabase();
  } catch (error) {
    console.error('[Startup Database Warning]: Failed to connect to MongoDB. Server is still listening for health checks, but DB operations will fail until MONGODB_URI is configured correctly in Render dashboard:', error);
  }
};

startServer();

export default app;
