import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { decimalToNumber, serializeOrder, serializeProviderProfile, serializeService, serializeUser } from '../utils/serialize.js';

const router = Router();

// Protect all admin endpoints
router.use(requireAuth, requireRole('ADMIN'));

const idParamSchema = z.object({
  id: z.string().cuid(),
});

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

const createServiceSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  basePrice: z.coerce.number().positive().max(100000),
  image: z.string().url().or(z.string().trim().max(500)).optional(),
});

const updateServiceSchema = z.object({
  categoryId: z.string().cuid().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  basePrice: z.coerce.number().positive().max(100000).optional(),
  image: z.string().url().or(z.string().trim().max(500)).optional(),
  isActive: z.boolean().optional(),
});

const updateProviderStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const moderateReviewSchema = z.object({
  isHidden: z.boolean().optional(),
  isReported: z.boolean().optional(),
});

// GET /api/admin/dashboard - High-level operational metrics
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      approvedProviders,
      pendingProviders,
      totalCategories,
      totalServices,
      totalOrders,
      ordersByStatusList,
      ordersByCategoryList,
      completedValueAgg,
      reviewStats,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        select: {
          service: {
            select: {
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { servicePrice: true },
      }),
      prisma.review.aggregate({
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true, email: true } },
          provider: { select: { fullName: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    const statusCounts = {
      PENDING: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      DISPUTED: 0,
    };
    for (const item of ordersByStatusList) {
      statusCounts[item.status] = item._count._all;
    }

    // Category breakdown
    const categoryCountsMap = {};
    for (const o of ordersByCategoryList) {
      const catName = o.service?.category?.name || 'Uncategorized';
      categoryCountsMap[catName] = (categoryCountsMap[catName] || 0) + 1;
    }
    const ordersByCategory = Object.entries(categoryCountsMap).map(([name, count]) => ({
      name,
      count,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalCustomers,
          totalProviders,
          approvedProviders,
          pendingProviders,
          totalCategories,
          totalServices,
          totalOrders,
          completedRevenue: decimalToNumber(completedValueAgg._sum.servicePrice) ?? 0,
          avgPlatformRating: reviewStats._avg.rating
            ? Number(reviewStats._avg.rating.toFixed(2))
            : null,
          totalReviews: reviewStats._count._all,
        },
        ordersByStatus: statusCounts,
        ordersByCategory,
        recentOrders: recentOrders.map(serializeOrder),
      },
    });
  }),
);

// GET /api/admin/users - User management
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, isActive, q, page = 1, pageSize = 20 } = req.query;

    const where = {
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: {
          providerProfile: true,
          _count: {
            select: {
              customerOrders: true,
              providerOrders: true,
              reviewsWritten: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: users.map((u) => ({
          ...serializeUser(u),
          providerProfile: serializeProviderProfile(u.providerProfile),
          orderCount: u.role === 'CUSTOMER' ? u._count.customerOrders : u._count.providerOrders,
          reviewsCount: u._count.reviewsWritten,
        })),
        pagination: {
          page: p,
          pageSize: ps,
          total,
          totalPages: Math.ceil(total / ps),
        },
      },
    });
  }),
);

// PATCH /api/admin/users/:id/status - Toggle user active/suspended
router.patch(
  '/users/:id/status',
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'You cannot deactivate your own admin account');
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive },
    });

    res.json({
      success: true,
      data: serializeUser(updated),
    });
  }),
);

// GET /api/admin/providers - Provider approvals list
router.get(
  '/providers',
  asyncHandler(async (req, res) => {
    const { status, q } = req.query;

    const where = {
      ...(status ? { verificationStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { user: { fullName: { contains: q, mode: 'insensitive' } } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true } },
        providerServices: {
          include: { service: { select: { name: true, basePrice: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: providers.map((p) => ({
        ...serializeProviderProfile(p),
        user: p.user,
      })),
    });
  }),
);

// PATCH /api/admin/providers/:id/status - Approve/reject/suspend provider
router.patch(
  '/providers/:id/status',
  validate({ params: idParamSchema, body: updateProviderStatusSchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data: { verificationStatus: req.body.status },
      include: {
        user: { select: { id: true, fullName: true, email: true, isActive: true } },
      },
    });

    res.json({
      success: true,
      data: {
        ...serializeProviderProfile(updated),
        user: updated.user,
      },
    });
  }),
);

// GET /api/admin/categories - All categories
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    res.json({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isActive: c.isActive,
        createdAt: c.createdAt,
        serviceCount: c._count.services,
      })),
    });
  }),
);

// POST /api/admin/categories - Create category
router.post(
  '/categories',
  validate({ body: createCategorySchema }),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      throw new AppError(409, 'CATEGORY_EXISTS', 'Category with this name already exists');
    }

    const category = await prisma.category.create({
      data: { name, description: description ?? null },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  }),
);

// PATCH /api/admin/categories/:id - Update category
router.patch(
  '/categories/:id',
  validate({ params: idParamSchema, body: updateCategorySchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({
      success: true,
      data: updated,
    });
  }),
);

// GET /api/admin/services - All services
router.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        _count: {
          select: { providerServices: true, orders: true },
        },
      },
    });

    res.json({
      success: true,
      data: services.map((s) => ({
        ...serializeService(s),
        providerCount: s._count.providerServices,
        orderCount: s._count.orders,
      })),
    });
  }),
);

// POST /api/admin/services - Create service
router.post(
  '/services',
  validate({ body: createServiceSchema }),
  asyncHandler(async (req, res) => {
    const { categoryId, name, description, basePrice, image } = req.body;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Specified category does not exist');
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        name,
        description: description ?? null,
        basePrice,
        image: image ?? null,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      data: serializeService(service),
    });
  }),
);

// PATCH /api/admin/services/:id - Update service
router.patch(
  '/services/:id',
  validate({ params: idParamSchema, body: updateServiceSchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true },
    });

    res.json({
      success: true,
      data: serializeService(updated),
    });
  }),
);

// GET /api/admin/orders - All orders with full filtering
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, providerId, customerId, q, page = 1, pageSize = 20 } = req.query;

    const where = {
      ...(status ? { status } : {}),
      ...(providerId ? { providerId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { serviceNameSnapshot: { contains: q, mode: 'insensitive' } },
              { customer: { fullName: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          provider: {
            select: {
              id: true,
              fullName: true,
              providerProfile: { select: { businessName: true } },
            },
          },
          service: { include: { category: true } },
          payment: true,
          review: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: orders.map(serializeOrder),
        pagination: {
          page: p,
          pageSize: ps,
          total,
          totalPages: Math.ceil(total / ps),
        },
      },
    });
  }),
);

// GET /api/admin/orders/:id/events - Audit history of an order
router.get(
  '/orders/:id/events',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const events = await prisma.orderEvent.findMany({
      where: { orderId: req.params.id },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: events,
    });
  }),
);

// GET /api/admin/reviews - All reviews with moderation flags
router.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const { isReported, isHidden } = req.query;

    const where = {
      ...(isReported !== undefined ? { isReported: isReported === 'true' } : {}),
      ...(isHidden !== undefined ? { isHidden: isHidden === 'true' } : {}),
    };

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        provider: {
          select: {
            id: true,
            fullName: true,
            providerProfile: { select: { businessName: true } },
          },
        },
        order: { select: { id: true, orderNumber: true, serviceNameSnapshot: true } },
      },
    });

    res.json({
      success: true,
      data: reviews,
    });
  }),
);

// PATCH /api/admin/reviews/:id/moderate - Hide or restore review
router.patch(
  '/reviews/:id/moderate',
  validate({ params: idParamSchema, body: moderateReviewSchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({
      success: true,
      data: updated,
    });
  }),
);

// GET /api/admin/reports - Executive reports
router.get(
  '/reports',
  asyncHandler(async (_req, res) => {
    const topProviders = await prisma.review.groupBy({
      by: ['providerId'],
      where: { isHidden: false },
      _avg: { rating: true },
      _count: { _all: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: 5,
    });

    const providerUserIds = topProviders.map((tp) => tp.providerId);
    const users = await prisma.user.findMany({
      where: { id: { in: providerUserIds } },
      include: { providerProfile: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderBoard = topProviders.map((tp) => {
      const u = userMap.get(tp.providerId);
      return {
        providerId: tp.providerId,
        providerName: u?.fullName,
        businessName: u?.providerProfile?.businessName || u?.fullName,
        avgRating: tp._avg.rating ? Number(tp._avg.rating.toFixed(2)) : null,
        reviewCount: tp._count._all,
      };
    });

    res.json({
      success: true,
      data: {
        leaderBoard,
      },
    });
  }),
);

export default router;
