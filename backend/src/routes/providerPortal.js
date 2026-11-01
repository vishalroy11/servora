import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireApprovedProvider, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordOrderEvent } from '../utils/orderEvents.js';
import { assertTransition } from '../utils/orderTransitions.js';
import { decimalToNumber, serializeOrder, serializeProviderProfile } from '../utils/serialize.js';

const router = Router();

// Middleware: all provider routes require auth and PROVIDER role
router.use(requireAuth, requireRole('PROVIDER'));

const idParamSchema = z.object({
  id: z.string().cuid(),
});

const rejectOrderSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

const addServiceSchema = z.object({
  serviceId: z.string().cuid(),
  price: z.coerce.number().positive().max(100000),
});

const updateServiceSchema = z.object({
  price: z.coerce.number().positive().max(100000).optional(),
  isActive: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  serviceArea: z.string().trim().max(255).optional(),
  isAvailable: z.boolean().optional(),
});

// GET /api/provider/dashboard - Aggregate analytics
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'Provider profile not found');
    }

    const providerUserId = req.user.id;

    const [
      totalAssigned,
      completedOrders,
      cancelledOrders,
      activeJobs,
      rejectedOffersCount,
      completedSum,
      reviewStats,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { providerId: providerUserId } }),
      prisma.order.count({ where: { providerId: providerUserId, status: 'COMPLETED' } }),
      prisma.order.count({ where: { providerId: providerUserId, status: 'CANCELLED' } }),
      prisma.order.count({
        where: {
          providerId: providerUserId,
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        },
      }),
      prisma.providerOrderResponse.count({
        where: { providerId: providerUserId, response: 'REJECTED' },
      }),
      prisma.order.aggregate({
        where: { providerId: providerUserId, status: 'COMPLETED' },
        _sum: { servicePrice: true },
      }),
      prisma.review.aggregate({
        where: { providerId: providerUserId, isHidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: { providerId: providerUserId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          service: true,
          customer: { select: { fullName: true, phone: true } },
          payment: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        profile: serializeProviderProfile(profile),
        metrics: {
          totalAssigned,
          acceptedCount: totalAssigned,
          completedCount: completedOrders,
          cancelledCount: cancelledOrders,
          activeJobs,
          rejectedOffersCount,
          grossEarnings: decimalToNumber(completedSum._sum.servicePrice) ?? 0,
          avgRating: reviewStats._avg.rating
            ? Number(reviewStats._avg.rating.toFixed(2))
            : null,
          reviewCount: reviewStats._count._all,
        },
        recentOrders: recentOrders.map(serializeOrder),
      },
    });
  }),
);

// GET /api/provider/orders/available - Available orders matching provider's services
router.get(
  '/orders/available',
  asyncHandler(async (req, res) => {
    const profile = await requireApprovedProvider(req);

    const providerServices = await prisma.providerService.findMany({
      where: { providerId: profile.id, isActive: true },
      select: { serviceId: true },
    });

    const offeredServiceIds = providerServices.map((ps) => ps.serviceId);

    if (offeredServiceIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const responses = await prisma.providerOrderResponse.findMany({
      where: { providerId: req.user.id },
      select: { orderId: true },
    });
    const respondedOrderIds = responses.map((r) => r.orderId);

    const availableOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        serviceId: { in: offeredServiceIds },
        id: { notIn: respondedOrderIds },
        OR: [{ providerId: null }, { providerId: req.user.id }],
      },
      include: {
        service: { include: { category: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({
      success: true,
      data: availableOrders.map(serializeOrder),
    });
  }),
);

// GET /api/provider/orders - Provider's assigned orders
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status } = req.query;

    const where = {
      providerId: req.user.id,
      ...(status ? { status } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        service: { include: { category: true } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        payment: true,
        review: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders.map(serializeOrder),
    });
  }),
);

// POST /api/provider/orders/:id/accept - Atomically accept order with concurrency lock
router.post(
  '/orders/:id/accept',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const profile = await requireApprovedProvider(req);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch order
      const order = await tx.order.findUnique({
        where: { id: req.params.id },
        include: { service: true },
      });

      if (!order) {
        throw new AppError(404, 'NOT_FOUND', 'Order not found');
      }

      // 2. Verify order is still available
      if (
        order.status !== 'PENDING' ||
        (order.providerId !== null && order.providerId !== req.user.id)
      ) {
        throw new AppError(
          409,
          'ORDER_ALREADY_ACCEPTED',
          'This order has already been accepted by another provider or is no longer pending',
        );
      }

      // 3. Verify provider offers this service
      const offersService = await tx.providerService.findUnique({
        where: {
          providerId_serviceId: {
            providerId: profile.id,
            serviceId: order.serviceId,
          },
        },
      });

      if (!offersService || !offersService.isActive) {
        throw new AppError(
          400,
          'SERVICE_NOT_OFFERED',
          'You do not offer the requested service',
        );
      }

      // 4. Atomic conditional update to prevent race conditions
      const updateResult = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'PENDING',
          OR: [{ providerId: null }, { providerId: req.user.id }],
        },
        data: {
          status: 'ACCEPTED',
          providerId: req.user.id,
          acceptedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new AppError(
          409,
          'CONCURRENCY_CONFLICT',
          'Another provider accepted this order simultaneously',
        );
      }

      // 5. Record order event
      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'ORDER_ACCEPTED',
        oldStatus: 'PENDING',
        newStatus: 'ACCEPTED',
        note: `Accepted by ${profile.businessName}`,
      });

      // 6. Record provider order response
      await tx.providerOrderResponse.upsert({
        where: {
          orderId_providerId: {
            orderId: order.id,
            providerId: req.user.id,
          },
        },
        update: {
          response: 'ACCEPTED',
          respondedAt: new Date(),
        },
        create: {
          orderId: order.id,
          providerId: req.user.id,
          response: 'ACCEPTED',
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          service: { include: { category: true } },
          customer: { select: { fullName: true, phone: true } },
          payment: true,
          events: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    res.json({
      success: true,
      data: serializeOrder(updatedOrder),
    });
  }),
);

// POST /api/provider/orders/:id/reject - Reject order offer
router.post(
  '/orders/:id/reject',
  validate({ params: idParamSchema, body: rejectOrderSchema }),
  asyncHandler(async (req, res) => {
    const { note } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    await prisma.$transaction(async (tx) => {
      // Record provider response
      await tx.providerOrderResponse.upsert({
        where: {
          orderId_providerId: {
            orderId: order.id,
            providerId: req.user.id,
          },
        },
        update: {
          response: 'REJECTED',
          respondedAt: new Date(),
          note: note ?? null,
        },
        create: {
          orderId: order.id,
          providerId: req.user.id,
          response: 'REJECTED',
          note: note ?? null,
        },
      });

      // If the order was exclusively assigned to this provider and still pending, free it up
      if (order.providerId === req.user.id && order.status === 'PENDING') {
        await tx.order.update({
          where: { id: order.id },
          data: { providerId: null },
        });

        await recordOrderEvent(tx, {
          orderId: order.id,
          actorUserId: req.user.id,
          eventType: 'PROVIDER_REJECTED',
          oldStatus: 'PENDING',
          newStatus: 'PENDING',
          note: note ?? 'Provider declined direct request; opened to marketplace',
        });
      }
    });

    res.json({
      success: true,
      data: { message: 'Order offer rejected' },
    });
  }),
);

// POST /api/provider/orders/:id/start - Provider starts the job
router.post(
  '/orders/:id/start',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    if (order.providerId !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'You are not the assigned provider for this order');
    }

    assertTransition(order.status, 'IN_PROGRESS');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'SERVICE_STARTED',
        oldStatus: order.status,
        newStatus: 'IN_PROGRESS',
        note: 'Provider started service',
      });

      return result;
    });

    res.json({
      success: true,
      data: serializeOrder(updated),
    });
  }),
);

// POST /api/provider/orders/:id/complete - Provider completes the job
router.post(
  '/orders/:id/complete',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    if (order.providerId !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'You are not the assigned provider for this order');
    }

    assertTransition(order.status, 'COMPLETED');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await tx.payment
        .update({
          where: { orderId: order.id },
          data: { paymentStatus: 'COMPLETED' },
        })
        .catch(() => {});

      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'SERVICE_COMPLETED',
        oldStatus: order.status,
        newStatus: 'COMPLETED',
        note: 'Provider marked service as completed',
      });

      return result;
    });

    res.json({
      success: true,
      data: serializeOrder(updated),
    });
  }),
);

// GET /api/provider/services - Provider catalog offerings
router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        providerServices: {
          include: {
            service: { include: { category: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'Provider profile not found');
    }

    res.json({
      success: true,
      data: profile.providerServices.map((ps) => ({
        id: ps.id,
        serviceId: ps.serviceId,
        price: decimalToNumber(ps.price),
        isActive: ps.isActive,
        createdAt: ps.createdAt,
        service: {
          ...ps.service,
          basePrice: decimalToNumber(ps.service.basePrice),
        },
      })),
    });
  }),
);

// POST /api/provider/services - Add service to offerings
router.post(
  '/services',
  validate({ body: addServiceSchema }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'Provider profile not found');
    }

    const { serviceId, price } = req.body;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'Service not found or inactive');
    }

    const created = await prisma.providerService.upsert({
      where: {
        providerId_serviceId: {
          providerId: profile.id,
          serviceId,
        },
      },
      update: {
        price,
        isActive: true,
      },
      create: {
        providerId: profile.id,
        serviceId,
        price,
        isActive: true,
      },
      include: {
        service: { include: { category: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: created.id,
        serviceId: created.serviceId,
        price: decimalToNumber(created.price),
        isActive: created.isActive,
        service: {
          ...created.service,
          basePrice: decimalToNumber(created.service.basePrice),
        },
      },
    });
  }),
);

// PUT /api/provider/services/:id - Update custom pricing or toggle active
router.put(
  '/services/:id',
  validate({ params: idParamSchema, body: updateServiceSchema }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const providerService = await prisma.providerService.findUnique({
      where: { id: req.params.id },
    });

    if (!providerService || providerService.providerId !== profile.id) {
      throw new AppError(404, 'NOT_FOUND', 'Provider service listing not found');
    }

    const { price, isActive } = req.body;

    const updated = await prisma.providerService.update({
      where: { id: req.params.id },
      data: {
        ...(price !== undefined ? { price } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        service: { include: { category: true } },
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        serviceId: updated.serviceId,
        price: decimalToNumber(updated.price),
        isActive: updated.isActive,
        service: {
          ...updated.service,
          basePrice: decimalToNumber(updated.service.basePrice),
        },
      },
    });
  }),
);

// DELETE /api/provider/services/:id - Remove service from offerings
router.delete(
  '/services/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const providerService = await prisma.providerService.findUnique({
      where: { id: req.params.id },
    });

    if (!providerService || providerService.providerId !== profile.id) {
      throw new AppError(404, 'NOT_FOUND', 'Provider service listing not found');
    }

    await prisma.providerService.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { message: 'Service removed from offerings' },
    });
  }),
);

// PUT /api/provider/profile - Update provider profile details
router.put(
  '/profile',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const { businessName, bio, serviceArea, isAvailable } = req.body;

    const profile = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(businessName ? { businessName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(serviceArea !== undefined ? { serviceArea } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
      },
    });

    res.json({
      success: true,
      data: serializeProviderProfile(profile),
    });
  }),
);

export default router;
