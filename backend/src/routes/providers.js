import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decimalToNumber, serializeProviderProfile } from '../utils/serialize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const idParamSchema = z.object({
  id: z.string().cuid(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { serviceId, q } = req.query;

    const where = {
      verificationStatus: 'APPROVED',
      user: { isActive: true },
      ...(serviceId
        ? {
            providerServices: {
              some: {
                serviceId,
                isActive: true,
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { serviceArea: { contains: q, mode: 'insensitive' } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { businessName: 'asc' },
    });

    const providerUserIds = providers.map((p) => p.userId);
    const reviewStats = await prisma.review.groupBy({
      by: ['providerId'],
      where: {
        providerId: { in: providerUserIds },
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const statsMap = new Map(
      reviewStats.map((r) => [
        r.providerId,
        {
          avgRating: r._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
          reviewCount: r._count._all,
        },
      ]),
    );

    res.json({
      success: true,
      data: providers.map((p) => {
        const stats = statsMap.get(p.userId) ?? { avgRating: null, reviewCount: 0 };
        return {
          ...serializeProviderProfile(p),
          user: p.user,
          avgRating: stats.avgRating,
          reviewCount: stats.reviewCount,
          services: p.providerServices.map((ps) => ({
            id: ps.id,
            price: decimalToNumber(ps.price),
            service: {
              ...ps.service,
              basePrice: decimalToNumber(ps.service.basePrice),
            },
          })),
        };
      }),
    });
  }),
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findFirst({
      where: {
        userId: req.params.id,
        verificationStatus: 'APPROVED',
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          include: {
            service: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'Provider not found');
    }

    const [reviewStats, recentReviews] = await Promise.all([
      prisma.review.aggregate({
        where: {
          providerId: profile.userId,
          isHidden: false,
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: {
          providerId: profile.userId,
          isHidden: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              serviceNameSnapshot: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...serializeProviderProfile(profile),
        user: profile.user,
        avgRating: reviewStats._avg.rating
          ? Number(reviewStats._avg.rating.toFixed(2))
          : null,
        reviewCount: reviewStats._count._all,
        services: profile.providerServices.map((ps) => ({
          id: ps.id,
          price: decimalToNumber(ps.price),
          isActive: ps.isActive,
          service: {
            ...ps.service,
            basePrice: decimalToNumber(ps.service.basePrice),
          },
        })),
        recentReviews: recentReviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          customer: review.customer,
          order: review.order,
        })),
      },
    });
  }),
);

export default router;
