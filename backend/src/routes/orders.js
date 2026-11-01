import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { recordOrderEvent } from '../utils/orderEvents.js';
import { assertTransition } from '../utils/orderTransitions.js';
import { serializeOrder } from '../utils/serialize.js';

const router = Router();

const createOrderSchema = z.object({
  serviceId: z.string().cuid(),
  providerId: z.string().cuid().optional(),
  serviceAddress: z.string().trim().min(5).max(500),
  scheduledAt: z.coerce.date(),
  customerInstructions: z.string().trim().max(2000).optional(),
});

const listMyOrdersQuerySchema = z.object({
  status: z
    .enum([
      'PENDING',
      'ACCEPTED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'DISPUTED',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const idParamSchema = z.object({
  id: z.string().cuid(),
});

const cancelOrderSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

// POST /api/orders - Customer creates a booking
router.post(
  '/',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const {
      serviceId,
      providerId,
      serviceAddress,
      scheduledAt,
      customerInstructions,
    } = req.body;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found or inactive');
    }

    let agreedPrice = service.basePrice;
    let assignedProviderId = null;

    if (providerId) {
      const providerProfile = await prisma.providerProfile.findFirst({
        where: {
          userId: providerId,
          verificationStatus: 'APPROVED',
          isAvailable: true,
          user: { isActive: true },
        },
      });

      if (!providerProfile) {
        throw new AppError(
          400,
          'PROVIDER_UNAVAILABLE',
          'Selected provider is not available or not approved',
        );
      }

      const providerService = await prisma.providerService.findUnique({
        where: {
          providerId_serviceId: {
            providerId: providerProfile.id,
            serviceId,
          },
        },
      });

      if (!providerService || !providerService.isActive) {
        throw new AppError(
          400,
          'SERVICE_NOT_OFFERED',
          'Provider does not offer this service',
        );
      }

      agreedPrice = providerService.price;
      assignedProviderId = providerId;
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: req.user.id,
          serviceId,
          providerId: assignedProviderId,
          serviceNameSnapshot: service.name,
          servicePrice: agreedPrice,
          serviceAddress,
          scheduledAt,
          customerInstructions: customerInstructions ?? null,
          status: 'PENDING',
        },
      });

      await recordOrderEvent(tx, {
        orderId: created.id,
        actorUserId: req.user.id,
        eventType: 'ORDER_CREATED',
        oldStatus: null,
        newStatus: 'PENDING',
        note: assignedProviderId
          ? 'Order created with assigned provider'
          : 'Order created for open provider acceptance',
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: agreedPrice,
          currency: 'USD',
          paymentMethod: 'CARD',
          paymentStatus: 'PENDING',
          transactionReference: `TX-${orderNumber}`,
        },
      });

      return created;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        service: { include: { category: true } },
        provider: { include: { providerProfile: true } },
        payment: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.status(201).json({
      success: true,
      data: serializeOrder(fullOrder),
    });
  }),
);

// GET /api/orders/my-orders - Customer order history
router.get(
  '/my-orders',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ query: listMyOrdersQuerySchema }),
  asyncHandler(async (req, res) => {
    const { status, page, pageSize } = req.query;

    const where = {
      customerId: req.user.id,
      ...(status ? { status } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          service: { include: { category: true } },
          provider: { include: { providerProfile: true } },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: orders.map(serializeOrder),
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

// GET /api/orders/:id - Get order details
router.get(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            providerProfile: true,
          },
        },
        service: { include: { category: true } },
        payment: true,
        review: true,
        events: {
          include: {
            actor: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const isCustomer = order.customerId === req.user.id;
    const isAssignedProvider = order.providerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isAssignedProvider && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'Access to this order is denied');
    }

    res.json({
      success: true,
      data: serializeOrder(order),
    });
  }),
);

// POST /api/orders/:id/cancel - Cancel order
router.post(
  '/:id/cancel',
  requireAuth,
  validate({ params: idParamSchema, body: cancelOrderSchema }),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const isCustomer = order.customerId === req.user.id;
    const isAssignedProvider = order.providerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isAssignedProvider && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot cancel this order');
    }

    // Cancellation rule check
    assertTransition(order.status, 'CANCELLED');

    const cancelledBy = isAdmin ? 'ADMIN' : isCustomer ? 'CUSTOMER' : 'PROVIDER';

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: reason ?? 'Cancelled by user',
        },
      });

      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'ORDER_CANCELLED',
        oldStatus: order.status,
        newStatus: 'CANCELLED',
        note: reason ?? `Cancelled by ${cancelledBy.toLowerCase()}`,
      });

      // Update payment status if exists
      await tx.payment
        .update({
          where: { orderId: order.id },
          data: { paymentStatus: 'REFUNDED' },
        })
        .catch(() => {});

      return result;
    });

    res.json({
      success: true,
      data: serializeOrder(updated),
    });
  }),
);

// POST /api/orders/:id/confirm - Customer confirms completion
router.post(
  '/:id/confirm',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    if (order.customerId !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Only the order customer can confirm completion');
    }

    if (order.status !== 'IN_PROGRESS' && order.status !== 'COMPLETED') {
      throw new AppError(
        400,
        'INVALID_STATE',
        'Cannot confirm completion in current order state',
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          customerConfirmedAt: new Date(),
        },
      });

      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'CUSTOMER_CONFIRMED',
        oldStatus: order.status,
        newStatus: order.status,
        note: 'Customer confirmed service completion',
      });

      return result;
    });

    res.json({
      success: true,
      data: serializeOrder(updated),
    });
  }),
);

// POST /api/orders/:id/dispute - Raise dispute
router.post(
  '/:id/dispute',
  requireAuth,
  validate({
    params: idParamSchema,
    body: z.object({ reason: z.string().trim().min(5).max(1000) }),
  }),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const isCustomer = order.customerId === req.user.id;
    const isAssignedProvider = order.providerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isAssignedProvider && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot raise dispute on this order');
    }

    assertTransition(order.status, 'DISPUTED');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: { status: 'DISPUTED' },
      });

      await recordOrderEvent(tx, {
        orderId: order.id,
        actorUserId: req.user.id,
        eventType: 'ORDER_DISPUTED',
        oldStatus: order.status,
        newStatus: 'DISPUTED',
        note: reason,
      });

      return result;
    });

    res.json({
      success: true,
      data: serializeOrder(updated),
    });
  }),
);

export default router;
