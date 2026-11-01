import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { getSessionToken, hashToken } from '../utils/session.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function loadUserFromSession(req) {
  const token = getSessionToken(req);

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          providerProfile: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (!session.user.isActive) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive');
  }

  return session.user;
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await loadUserFromSession(req);
  next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await loadUserFromSession(req);

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  req.user = user;
  next();
});

export function requireRole(...roles) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  });
}

export async function requireApprovedProvider(req) {
  if (req.user.role !== 'PROVIDER') {
    throw new AppError(403, 'FORBIDDEN', 'Provider access required');
  }

  const profile = req.user.providerProfile;

  if (!profile) {
    throw new AppError(403, 'NO_PROVIDER_PROFILE', 'Provider profile not found');
  }

  if (profile.verificationStatus !== 'APPROVED') {
    throw new AppError(
      403,
      'PROVIDER_NOT_APPROVED',
      'Provider profile is not approved',
    );
  }

  if (!profile.isAvailable) {
    throw new AppError(
      403,
      'PROVIDER_UNAVAILABLE',
      'Provider profile is not available',
    );
  }

  return profile;
}
