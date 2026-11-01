import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionToken,
  setSessionCookie,
} from '../utils/session.js';
import { serializeProviderProfile, serializeUser } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(6).max(20).optional(),
    password: z.string().min(8).max(128),
    role: z.enum(['CUSTOMER', 'PROVIDER']),
    businessName: z.string().trim().min(2).max(120).optional(),
    bio: z.string().trim().max(2000).optional(),
    serviceArea: z.string().trim().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'PROVIDER' && !data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'businessName is required for providers',
        path: ['businessName'],
      });
    }
  });

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, password, role, businessName, bio, serviceArea } =
      req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email is already registered');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone: phone ?? null,
        passwordHash,
        role,
        ...(role === 'PROVIDER'
          ? {
              providerProfile: {
                create: {
                  businessName: businessName,
                  bio: bio ?? null,
                  serviceArea: serviceArea ?? null,
                },
              },
            }
          : {}),
      },
      include: {
        providerProfile: true,
      },
    });

    const { token } = await createSession(user.id);
    setSessionCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        user: serializeUser(user),
        providerProfile: serializeProviderProfile(user.providerProfile),
      },
    });
  }),
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { providerProfile: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive');
    }

    const { token } = await createSession(user.id);
    setSessionCookie(res, token);

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        providerProfile: serializeProviderProfile(user.providerProfile),
      },
    });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = getSessionToken(req);
    await destroySession(token);
    clearSessionCookie(res);

    res.json({
      success: true,
      data: { message: 'Logged out' },
    });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: serializeUser(req.user),
        providerProfile: serializeProviderProfile(req.user.providerProfile),
      },
    });
  }),
);

router.put(
  '/profile',
  requireAuth,
  validate({
    body: z.object({
      fullName: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(20).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { fullName, phone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
      include: { providerProfile: true },
    });

    res.json({
      success: true,
      data: {
        user: serializeUser(updated),
        providerProfile: serializeProviderProfile(updated.providerProfile),
      },
    });
  }),
);

export default router;
