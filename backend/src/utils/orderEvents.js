import { prisma } from '../config/prisma.js';

export async function recordOrderEvent(
  tx,
  { orderId, actorUserId, eventType, oldStatus, newStatus, note },
) {
  const client = tx ?? prisma;

  return client.orderEvent.create({
    data: {
      orderId,
      actorUserId: actorUserId ?? null,
      eventType,
      oldStatus: oldStatus ?? null,
      newStatus: newStatus ?? null,
      note: note ?? null,
    },
  });
}
