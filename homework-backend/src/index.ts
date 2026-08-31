import 'reflect-metadata';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { config } from './config/env';
import { AppDataSource } from './config/data-source';
import apiRouter from './routes';
import { AppError } from './utils/errors';

// Absolute path to the compiled React frontend (relative to this compiled file in dist/)
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'homework-frontend', 'dist');

const app = express();

// Security & Parsing Middlewares
// In production (local desktop app), CSP is relaxed — no internet exposure risk.
app.use(
  helmet({
    contentSecurityPolicy: config.isProduction ? false : undefined,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (must come before static serving so /api/* is never intercepted by the SPA fallback)
app.use('/api', apiRouter);

// ── Production: Serve compiled React frontend ──────────────────────────────────
if (config.isProduction) {
  // 1. Serve all static assets (JS, CSS, images) from the dist folder
  app.use(express.static(FRONTEND_DIST));

  // 2. SPA fallback — any GET request that doesn't match an API route or a
  //    static file gets index.html so React Router can handle client-side routing.
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// 404 Not Found Middleware
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized Global Error Handler Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: 'Uploaded file exceeds the maximum allowed limit of 10MB',
      });
      return;
    }
    res.status(400).json({
      error: err.code,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  // Handle Known Operational Errors (BadRequestError, NotFoundError, ServiceUnavailableError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.constructor.name,
      message: err.message,
    });
    return;
  }

  // Handle Unhandled System / Database Errors
  console.error('💥 Unhandled Exception:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = config.isProduction
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: 'InternalServerError',
    message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
});


// Initialize Database and Start Server
async function startServer() {
  try {
    console.log('Connecting to SQLite database via TypeORM...');
    await AppDataSource.initialize();
    console.log('✅ SQLite Database connected successfully.');

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📡 Healthcheck available at http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Fatal error during server initialization:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
  process.exit(0);
});

startServer();
