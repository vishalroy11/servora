import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordOrderEvent } from '../utils/orderEvents.js';

const router = Router();

const idParamSchema = z.object({
  id: z.string().cuid(),
});

const submitReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().max(2000).optional(),
});

// POST /api/orders/:id/review - Customer submits review for a completed order
router.post(
  '/orders/:id/review',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ params: idParamSchema, body: submitReviewSchema }),
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    if (order.customerId !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Only the customer of this order can submit a review');
    }

    if (order.status !== 'COMPLETED') {
      throw new AppError(
        400,
        'ORDER_NOT_COMPLETED',
        'Reviews can only be submitted for completed orders',
      );
    }

    if (!order.providerId) {
      throw new AppError(
        400,
        'NO_PROVIDER',
        'Cannot review an order with no assigned provider',
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      throw new AppError(409, 'REVIEW_EXISTS', 'A review has already been submitted for this order');
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId,
          customerId: req.user.id,
          providerId: order.providerId,
          rating,
          comment: comment ?? null,
        },
      });

      await recordOrderEvent(tx, {
        orderId,
        actorUserId: req.user.id,
        eventType: 'REVIEW_SUBMITTED',
        oldStatus: order.status,
        newStatus: order.status,
        note: `Customer rated ${rating}/5 stars`,
      });

      return created;
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  }),
);

// GET /api/reviews/my-reviews - Customer views their written reviews
router.get(
  '/my-reviews',
  requireAuth,
  requireRole('CUSTOMER'),
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { customerId: req.user.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            serviceNameSnapshot: true,
            completedAt: true,
          },
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            providerProfile: { select: { businessName: true, profileImage: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        order: r.order,
        provider: {
          id: r.provider.id,
          fullName: r.provider.fullName,
          businessName: r.provider.providerProfile?.businessName || r.provider.fullName,
        },
      })),
    });
  }),
);

// POST /api/reviews/:id/report - Flag/report review
router.post(
  '/:id/report',
  requireAuth,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!review) {
      throw new AppError(404, 'NOT_FOUND', 'Review not found');
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { isReported: true },
    });

    res.json({
      success: true,
      data: { message: 'Review reported for administrative moderation', reviewId: updated.id },
    });
  }),
);

export default router;
