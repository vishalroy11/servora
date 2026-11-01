import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1 AS ok`;
    const dbLatencyMs = Date.now() - started;

    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'servora-api',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs: dbLatencyMs,
        },
      },
    });
  } catch (error) {
    error.statusCode = 503;
    error.code = 'DATABASE_UNAVAILABLE';
    error.message = 'API is up but database connection failed';
    next(error);
  }
});

export default router;
