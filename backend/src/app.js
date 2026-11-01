import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import servicesRouter from './routes/services.js';
import providersRouter from './routes/providers.js';
import ordersRouter from './routes/orders.js';
import providerPortalRouter from './routes/providerPortal.js';
import reviewsRouter from './routes/reviews.js';
import adminRouter from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Rate limiter for authentication endpoints (skipped in test)
  if (env.NODE_ENV !== 'test') {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many authentication attempts, please try again later.',
        },
      },
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
  }

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        name: 'Servora API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
          health: 'GET /api/health',
          auth: '/api/auth',
          categories: '/api/categories',
          services: '/api/services',
          providers: '/api/providers',
          orders: '/api/orders',
          provider: '/api/provider',
          reviews: '/api/reviews',
          admin: '/api/admin',
        },
      },
    });
  });

  // Mount API routers
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/provider', providerPortalRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/admin', adminRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
