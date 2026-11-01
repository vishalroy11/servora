import { AppError } from './AppError.js';

export const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: [],
};

export function assertTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new AppError(
      409,
      'INVALID_TRANSITION',
      `Cannot transition order from ${from} to ${to}`,
    );
  }
}
