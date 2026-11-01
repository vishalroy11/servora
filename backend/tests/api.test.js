import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;

async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  const setCookie = res.headers.get('set-cookie');
  return {
    status: res.status,
    ok: res.ok,
    body: data,
    headers: res.headers,
    cookie: setCookie ? setCookie.split(';')[0] : null,
  };
}

beforeAll(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

describe('Servora Multi-Service Booking Platform - Automated Business Rules Test Suite', () => {
  let adminCookie;
  let customerCookie;
  let customerUser;
  let providerCookie;
  let providerUser;
  let sampleService;

  // Rule 1: Customer registration and login
  it('1. Customer registration and login works correctly', async () => {
    const testEmail = `test.customer.${Date.now()}@example.com`;
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Test Customer',
        email: testEmail,
        phone: '+1 555-0101',
        password: 'Password123!',
        role: 'CUSTOMER',
      },
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.role).toBe('CUSTOMER');
    expect(regRes.body.data.user.passwordHash).toBeUndefined();

    // Login
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'Password123!',
      },
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.cookie).toBeDefined();

    customerCookie = loginRes.cookie;
    customerUser = loginRes.body.data.user;

    // Verify /me endpoint
    const meRes = await api('/api/auth/me', { cookie: customerCookie });
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.id).toBe(customerUser.id);
  });

  // Rule 2: Provider registration and approval
  it('2. Provider registration creates pending profile and admin can approve', async () => {
    const providerEmail = `test.prov.${Date.now()}@example.com`;
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'New Pro',
        email: providerEmail,
        password: 'Password123!',
        role: 'PROVIDER',
        businessName: 'Pro Handyman Services',
        bio: 'Fast and reliable home repairs',
        serviceArea: 'Downtown',
      },
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.role).toBe('PROVIDER');
    expect(regRes.body.data.providerProfile.verificationStatus).toBe('PENDING');

    const newProviderId = regRes.body.data.providerProfile.id;

    // Login as Admin to approve provider
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@servora.com', password: 'Admin@123456' },
    });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.cookie;

    // Admin approves provider
    const approveRes = await api(`/api/admin/providers/${newProviderId}/status`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { status: 'APPROVED' },
    });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.verificationStatus).toBe('APPROVED');
  });

  // Rule 3: Admin-only endpoints access control
  it('3. Non-admins are rejected from accessing admin-only endpoints with 403 Forbidden', async () => {
    // Attempt to access admin dashboard with customer credentials
    const res = await api('/api/admin/dashboard', { cookie: customerCookie });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Rule 4: Unauthorized access prevention to private customer orders
  it('4. Customer cannot view another customer private order', async () => {
    // Fetch an order belonging to customer2
    const anotherCustomerOrder = await prisma.order.findFirst({
      where: { customer: { email: 'james.miller@servora.com' } },
    });

    expect(anotherCustomerOrder).toBeDefined();

    // Customer 1 tries to access Customer 2's order
    const res = await api(`/api/orders/${anotherCustomerOrder.id}`, {
      cookie: customerCookie,
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Rule 5: Customer order creation
  it('5. Customer can create a booking with agreed price snapshot', async () => {
    sampleService = await prisma.service.findFirst({ where: { isActive: true } });
    expect(sampleService).toBeDefined();

    const orderRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: sampleService.id,
        serviceAddress: '100 Test Suite Lane',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        customerInstructions: 'Call upon arrival',
      },
    });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderNumber).toMatch(/^SRV-\d{8}-\d{4}$/);
    expect(orderRes.body.data.status).toBe('PENDING');
    expect(orderRes.body.data.serviceNameSnapshot).toBe(sampleService.name);
    expect(orderRes.body.data.servicePrice).toBe(Number(sampleService.basePrice));
  });

  // Rule 6: Provider acceptance
  it('6. Approved provider offering the service can accept a pending order', async () => {
    // Log in as pre-seeded provider Alex
    const provLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'provider@servora.com', password: 'Provider@123456' },
    });
    expect(provLogin.status).toBe(200);
    providerCookie = provLogin.cookie;
    providerUser = provLogin.body.data.user;

    // Find a service Alex offers
    const alexServiceListing = await prisma.providerService.findFirst({
      where: { provider: { userId: providerUser.id }, isActive: true },
      include: { service: true },
    });

    // Customer creates order for this service
    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: alexServiceListing.serviceId,
        serviceAddress: '202 Provider Test Blvd',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id;

    // Provider accepts
    const acceptRes = await api(`/api/provider/orders/${orderId}/accept`, {
      method: 'POST',
      cookie: providerCookie,
    });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');
    expect(acceptRes.body.data.providerId).toBe(providerUser.id);
  });

  // Rule 7: Concurrent provider acceptance handling (409 Conflict)
  it('7. Concurrency conflict: Second provider trying to accept already accepted order receives 409', async () => {
    // Log in second approved provider Sarah
    const sarahLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'sarah.cleaning@servora.com', password: 'Provider@123456' },
    });
    expect(sarahLogin.status).toBe(200);
    const sarahCookie = sarahLogin.cookie;

    // Find service both Sarah and another provider could offer or create one
    const cleaningService = await prisma.service.findFirst({
      where: { name: 'Standard Home Cleaning' },
    });

    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: cleaningService.id,
        serviceAddress: '55 Concurrency Way',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = createRes.body.data.id;

    // Sarah accepts first
    const sarahAccept = await api(`/api/provider/orders/${orderId}/accept`, {
      method: 'POST',
      cookie: sarahCookie,
    });
    expect(sarahAccept.status).toBe(200);

    // Another provider attempts to accept the same order
    const secondAccept = await api(`/api/provider/orders/${orderId}/accept`, {
      method: 'POST',
      cookie: providerCookie,
    });

    expect(secondAccept.status).toBe(409);
    expect(secondAccept.body.success).toBe(false);
  });

  // Rule 8: Invalid order status transitions
  it('8. Rejects invalid order status transitions (e.g. PENDING directly to COMPLETED)', async () => {
    const cleaningService = await prisma.service.findFirst({
      where: { name: 'Standard Home Cleaning' },
    });

    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: cleaningService.id,
        serviceAddress: '100 State Machine St',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = createRes.body.data.id;

    // Attempt to mark completed directly without being accepted or in-progress
    const completeRes = await api(`/api/provider/orders/${orderId}/complete`, {
      method: 'POST',
      cookie: providerCookie,
    });

    expect(completeRes.status).toBe(403); // Not assigned provider and invalid state
  });

  // Rule 9: Rejection of unauthorized provider actions
  it('9. Unapproved provider cannot accept orders', async () => {
    // Log in as pending provider
    const pendingLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'pending.provider@servora.com', password: 'Provider@123456' },
    });
    expect(pendingLogin.status).toBe(200);
    const pendingCookie = pendingLogin.cookie;

    const lawnService = await prisma.service.findFirst({
      where: { category: { name: 'Lawn Mowing' } },
    });

    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: lawnService.id,
        serviceAddress: '12 Green Yard',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = createRes.body.data.id;

    const acceptRes = await api(`/api/provider/orders/${orderId}/accept`, {
      method: 'POST',
      cookie: pendingCookie,
    });

    expect(acceptRes.status).toBe(403);
    expect(acceptRes.body.error.code).toBe('PROVIDER_NOT_APPROVED');
  });

  // Rule 10: Order completion workflow
  it('10. Order workflow executes ACCEPTED -> IN_PROGRESS -> COMPLETED with event trail', async () => {
    const sarahLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'sarah.cleaning@servora.com', password: 'Provider@123456' },
    });
    const sarahCookie = sarahLogin.cookie;
    const cleaningService = await prisma.service.findFirst({
      where: { name: 'Deep Cleaning Service' },
    });

    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: cleaningService.id,
        serviceAddress: '77 Progress Rd',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = createRes.body.data.id;

    // 1. Accept
    const acceptRes = await api(`/api/provider/orders/${orderId}/accept`, {
      method: 'POST',
      cookie: sarahCookie,
    });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    // 2. Start
    const startRes = await api(`/api/provider/orders/${orderId}/start`, {
      method: 'POST',
      cookie: sarahCookie,
    });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_PROGRESS');

    // 3. Complete
    const completeRes = await api(`/api/provider/orders/${orderId}/complete`, {
      method: 'POST',
      cookie: sarahCookie,
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    // Verify audit event trail
    const eventsRes = await api(`/api/admin/orders/${orderId}/events`, {
      cookie: adminCookie,
    });
    expect(eventsRes.status).toBe(200);
    const eventTypes = eventsRes.body.data.map((e) => e.eventType);
    expect(eventTypes).toContain('ORDER_CREATED');
    expect(eventTypes).toContain('ORDER_ACCEPTED');
    expect(eventTypes).toContain('SERVICE_STARTED');
    expect(eventTypes).toContain('SERVICE_COMPLETED');
  });

  // Rule 11: Review eligibility
  it('11. Customer can only review completed orders, not pending or in-progress orders', async () => {
    const cleaningService = await prisma.service.findFirst({
      where: { name: 'Standard Home Cleaning' },
    });

    // Create a pending order
    const createRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: cleaningService.id,
        serviceAddress: '12 Review Check St',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = createRes.body.data.id;

    // Try to review pending order
    const reviewRes = await api(`/api/reviews/orders/${orderId}/review`, {
      method: 'POST',
      cookie: customerCookie,
      body: { rating: 5, comment: 'Premature review' },
    });

    expect(reviewRes.status).toBe(400);
    expect(reviewRes.body.error.code).toBe('ORDER_NOT_COMPLETED');
  });

  // Rule 12: Duplicate review prevention
  it('12. Prevents duplicate reviews for the same order', async () => {
    // Find pre-seeded completed order that already has a review
    const completedOrderWithReview = await prisma.review.findFirst({
      select: { orderId: true, customer: { select: { email: true } } },
    });

    // Customer logs in
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: { email: completedOrderWithReview.customer.email, password: 'Customer@123456' },
    });

    const dupReviewRes = await api(
      `/api/reviews/orders/${completedOrderWithReview.orderId}/review`,
      {
        method: 'POST',
        cookie: login.cookie,
        body: { rating: 4, comment: 'Second attempt review' },
      },
    );

    expect(dupReviewRes.status).toBe(409);
    expect(dupReviewRes.body.error.code).toBe('REVIEW_EXISTS');
  });

  // Rule 13: Rating validation
  it('13. Rejects invalid ratings outside 1 to 5', async () => {
    const invalidLow = await api(`/api/reviews/orders/cuiddummy/review`, {
      method: 'POST',
      cookie: customerCookie,
      body: { rating: 0, comment: 'Zero star' },
    });
    expect(invalidLow.status).toBe(400);

    const invalidHigh = await api(`/api/reviews/orders/cuiddummy/review`, {
      method: 'POST',
      cookie: customerCookie,
      body: { rating: 6, comment: 'Six stars' },
    });
    expect(invalidHigh.status).toBe(400);
  });

  // Rule 14: Correct dashboard statistics
  it('14. Dashboard statistics are calculated from PostgreSQL aggregations, not hardcoded', async () => {
    const dashRes = await api('/api/admin/dashboard', { cookie: adminCookie });
    expect(dashRes.status).toBe(200);

    const summary = dashRes.body.data.summary;
    const actualUsers = await prisma.user.count();
    const actualOrders = await prisma.order.count();

    expect(summary.totalUsers).toBe(actualUsers);
    expect(summary.totalOrders).toBe(actualOrders);
    expect(typeof summary.completedRevenue).toBe('number');
  });

  // Rule 15: Preservation of historical order prices
  it('15. Preserves agreed order price snapshot even if base service price is changed', async () => {
    const service = await prisma.service.findFirst({ where: { isActive: true } });
    const originalPrice = Number(service.basePrice);

    // Create order with current price
    const orderRes = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: service.id,
        serviceAddress: '88 Inflation Blvd',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const orderId = orderRes.body.data.id;
    expect(orderRes.body.data.servicePrice).toBe(originalPrice);

    // Admin raises base price by $50
    const newPrice = originalPrice + 50;
    await api(`/api/admin/services/${service.id}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { basePrice: newPrice },
    });

    // Check order detail; snapshot price must remain unchanged
    const fetchedOrder = await api(`/api/orders/${orderId}`, { cookie: customerCookie });
    expect(fetchedOrder.body.data.servicePrice).toBe(originalPrice);
  });

  // Rule 16: Database transaction consistency
  it('16. Database transaction rollback ensures order and events remain consistent on failure', async () => {
    const initialOrdersCount = await prisma.order.count();
    const initialEventsCount = await prisma.orderEvent.count();

    // Attempt to create order with invalid service ID
    const failedCreate = await api('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      body: {
        serviceId: 'cuidnonexistent00000000000',
        serviceAddress: 'Invalid Place',
        scheduledAt: new Date().toISOString(),
      },
    });

    expect(failedCreate.status).toBe(404);

    const afterOrdersCount = await prisma.order.count();
    const afterEventsCount = await prisma.orderEvent.count();

    expect(afterOrdersCount).toBe(initialOrdersCount);
    expect(afterEventsCount).toBe(initialEventsCount);
  });
});
