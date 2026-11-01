import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decimalToNumber, serializeService } from '../utils/serialize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const listQuerySchema = z.object({
  categoryId: z.string().cuid().optional(),
  q: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const idParamSchema = z.object({
  id: z.string().cuid(),
});

async function getProviderRatingStats(providerUserIds) {
  if (providerUserIds.length === 0) {
    return new Map();
  }

  const aggregates = await prisma.review.groupBy({
    by: ['providerId'],
    where: {
      providerId: { in: providerUserIds },
      isHidden: false,
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    aggregates.map((row) => [
      row.providerId,
      {
        avgRating: row._avg.rating ? Number(row._avg.rating.toFixed(2)) : null,
        reviewCount: row._count._all,
      },
    ]),
  );
}

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const { categoryId, q, minPrice, maxPrice, page, pageSize } = req.query;

    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: services.map(serializeService),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  }),
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, isActive: true },
      include: {
        category: true,
        providerServices: {
          where: {
            isActive: true,
            provider: {
              verificationStatus: 'APPROVED',
              isAvailable: true,
            },
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new AppError(404, 'NOT_FOUND', 'Service not found');
    }

    const providerUserIds = service.providerServices.map((ps) => ps.provider.userId);
    const ratingMap = await getProviderRatingStats(providerUserIds);

    const providers = service.providerServices.map((ps) => {
      const stats = ratingMap.get(ps.provider.userId) ?? {
        avgRating: null,
        reviewCount: 0,
      };

      return {
        providerServiceId: ps.id,
        price: decimalToNumber(ps.price),
        providerProfileId: ps.providerId,
        providerUserId: ps.provider.userId,
        businessName: ps.provider.businessName,
        bio: ps.provider.bio,
        serviceArea: ps.provider.serviceArea,
        providerName: ps.provider.user.fullName,
        avgRating: stats.avgRating,
        reviewCount: stats.reviewCount,
      };
    });

    res.json({
      success: true,
      data: {
        ...serializeService(service),
        category: service.category,
        providers,
      },
    });
  }),
);

export default router;
