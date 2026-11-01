function decimalToNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

export function serializeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export function serializeProviderProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    providerServices: profile.providerServices?.map((ps) => ({
      ...ps,
      price: decimalToNumber(ps.price),
      service: ps.service
        ? {
            ...ps.service,
            basePrice: decimalToNumber(ps.service.basePrice),
          }
        : undefined,
    })),
  };
}

export function serializeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    ...order,
    servicePrice: decimalToNumber(order.servicePrice),
    payment: order.payment
      ? {
          ...order.payment,
          amount: decimalToNumber(order.payment.amount),
        }
      : undefined,
    review: order.review ?? undefined,
  };
}

export function serializeService(service) {
  if (!service) {
    return null;
  }

  return {
    ...service,
    basePrice: decimalToNumber(service.basePrice),
    providerServices: service.providerServices?.map((ps) => ({
      ...ps,
      price: decimalToNumber(ps.price),
    })),
  };
}

export { decimalToNumber };
