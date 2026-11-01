import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log('Seeding Servora database...');

  // 1. Clean existing records in referential integrity order
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.providerOrderResponse.deleteMany();
  await prisma.order.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned existing records.');

  // 2. Create Users
  const adminPassword = await hashPassword('Admin@123456');
  const userPassword = await hashPassword('Customer@123456');
  const providerPassword = await hashPassword('Provider@123456');

  const admin = await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@servora.com',
      phone: '+1 (555) 000-0001',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      fullName: 'Emily Watson',
      email: 'customer@servora.com',
      phone: '+1 (555) 234-5678',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      fullName: 'James Miller',
      email: 'james.miller@servora.com',
      phone: '+1 (555) 876-5432',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      fullName: 'Sophia Taylor',
      email: 'sophia.taylor@servora.com',
      phone: '+1 (555) 432-1098',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  // Approved Provider 1: Alex Rodriguez (Repairs & Handyman)
  const providerUser1 = await prisma.user.create({
    data: {
      fullName: 'Alex Rodriguez',
      email: 'provider@servora.com',
      phone: '+1 (555) 345-6789',
      passwordHash: providerPassword,
      role: 'PROVIDER',
      isActive: true,
      providerProfile: {
        create: {
          businessName: 'Apex Home & Repair Services',
          bio: 'Certified residential technician with 10+ years experience in electrical repairs, plumbing diagnostics, and quality handyman maintenance.',
          serviceArea: 'Downtown, North Hills, Westside',
          verificationStatus: 'APPROVED',
          isAvailable: true,
        },
      },
    },
    include: { providerProfile: true },
  });

  // Approved Provider 2: Sarah Jenkins (Home Cleaning)
  const providerUser2 = await prisma.user.create({
    data: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.cleaning@servora.com',
      phone: '+1 (555) 987-6543',
      passwordHash: providerPassword,
      role: 'PROVIDER',
      isActive: true,
      providerProfile: {
        create: {
          businessName: 'SparkleClean Pros',
          bio: 'Eco-friendly deep cleaning specialists using non-toxic and pet-safe products. Fully insured and bonded residential cleaners.',
          serviceArea: 'Metro Area, Greenfield, Oakwood',
          verificationStatus: 'APPROVED',
          isAvailable: true,
        },
      },
    },
    include: { providerProfile: true },
  });

  // Approved Provider 3: David Chen (Tech & Computers)
  const providerUser3 = await prisma.user.create({
    data: {
      fullName: 'David Chen',
      email: 'david.tech@servora.com',
      phone: '+1 (555) 654-3210',
      passwordHash: providerPassword,
      role: 'PROVIDER',
      isActive: true,
      providerProfile: {
        create: {
          businessName: 'ByteFix Computer Solutions',
          bio: 'Hardware repair, malware eradication, Wi-Fi networking, and custom workstation assembly. Rapid same-day troubleshooting.',
          serviceArea: 'Citywide & Onsite Support',
          verificationStatus: 'APPROVED',
          isAvailable: true,
        },
      },
    },
    include: { providerProfile: true },
  });

  // Pending Provider: Marcus Vance (Lawn & Landscaping)
  const providerUserPending = await prisma.user.create({
    data: {
      fullName: 'Marcus Vance',
      email: 'pending.provider@servora.com',
      phone: '+1 (555) 555-0199',
      passwordHash: providerPassword,
      role: 'PROVIDER',
      isActive: true,
      providerProfile: {
        create: {
          businessName: 'Vance Lawn & Landscaping',
          bio: 'Complete lawn care, edging, seasonal cleanups, and sod installation.',
          serviceArea: 'South Suburbs & Valley Area',
          verificationStatus: 'PENDING',
          isAvailable: true,
        },
      },
    },
    include: { providerProfile: true },
  });

  console.log('Created Users & Provider profiles.');

  // 3. Create Categories
  const categoriesData = [
    { name: 'Home Cleaning', description: 'Professional residential, apartment, and deep cleaning services.' },
    { name: 'Plumbing', description: 'Leak fixes, pipe diagnostics, unclogging, and fixture installation.' },
    { name: 'Electrical Repairs', description: 'Certified electrical wiring, fixture mounting, switch repairs, and inspections.' },
    { name: 'Appliance Repair', description: 'Diagnostics and repair for washers, dryers, fridges, and dishwashers.' },
    { name: 'Beauty Services', description: 'In-home hair styling, grooming, manicures, and wellness treatments.' },
    { name: 'Lawn Mowing', description: 'Lawn mowing, aeration, weed control, edging, and seasonal yard maintenance.' },
    { name: 'Tutoring', description: 'Academic coaching, test preparation, and private tutoring across STEM and languages.' },
    { name: 'Computer Repair', description: 'Desktop, laptop, network setup, virus removal, and data recovery services.' },
    { name: 'Handyman Services', description: 'Furniture assembly, drywall repairs, door locks, and general home improvements.' },
    { name: 'Pet Care', description: 'Reliable dog walking, pet sitting, feeding, and grooming assistance.' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.name] = created;
  }
  console.log('Created 10 Categories.');

  // 4. Create Services
  const servicesData = [
    // Home Cleaning
    { category: 'Home Cleaning', name: 'Standard Home Cleaning', description: 'Thorough dusting, vacuuming, mopping, bathroom sanitation, and kitchen surface wipe-down.', basePrice: 85.0 },
    { category: 'Home Cleaning', name: 'Deep Cleaning Service', description: 'Intensive scrub of baseboards, inside oven/microwave, tile grout, and hard-to-reach areas.', basePrice: 160.0 },
    { category: 'Home Cleaning', name: 'Move-in / Move-out Cleaning', description: 'Empty home comprehensive deep clean ensuring ready-to-move-in perfection.', basePrice: 220.0 },
    // Plumbing
    { category: 'Plumbing', name: 'Drain Unclogging & Cleaning', description: 'Rapid clearing of blocked sinks, showers, toilets, and main drain lines.', basePrice: 95.0 },
    { category: 'Plumbing', name: 'Faucet & Pipe Leak Repair', description: 'Inspection and repair of leaking kitchen/bathroom faucets, P-traps, and supply lines.', basePrice: 120.0 },
    { category: 'Plumbing', name: 'Water Heater Diagnostic & Flush', description: 'Tankless or standard water heater temperature testing, element check, and sediment flush.', basePrice: 180.0 },
    // Electrical Repairs
    { category: 'Electrical Repairs', name: 'Light Fixture & Fan Installation', description: 'Safe mounting and wiring of chandeliers, ceiling fans, vanity lights, and pendants.', basePrice: 80.0 },
    { category: 'Electrical Repairs', name: 'Outlet & Switch Replacement', description: 'Upgrade to GFCI outlets, smart dimmer switches, or replace faulty receptacles.', basePrice: 65.0 },
    { category: 'Electrical Repairs', name: 'Electrical Panel Inspection', description: 'Comprehensive panel load assessment, breaker checks, and safety code verification.', basePrice: 150.0 },
    // Appliance Repair
    { category: 'Appliance Repair', name: 'Refrigerator Diagnostic & Repair', description: 'Cooling problem diagnosis, condenser cleaning, seal replacement, and ice-maker repair.', basePrice: 130.0 },
    { category: 'Appliance Repair', name: 'Washing Machine & Dryer Service', description: 'Belt replacement, pump unclogging, heating element repair, and spin cycle troubleshooting.', basePrice: 115.0 },
    // Computer Repair
    { category: 'Computer Repair', name: 'Virus & Malware Removal', description: 'Deep scan, eradication of malicious software, spyware cleanup, and system optimization.', basePrice: 75.0 },
    { category: 'Computer Repair', name: 'Laptop Screen & Battery Replacement', description: 'Precision replacement of damaged LCD panels and degraded battery packs.', basePrice: 120.0 },
    { category: 'Computer Repair', name: 'Home Wi-Fi & Network Setup', description: 'Router configuration, mesh Wi-Fi optimization, network security, and printer pairing.', basePrice: 90.0 },
    // Handyman Services
    { category: 'Handyman Services', name: 'Furniture Assembly', description: 'Fast, correct assembly of IKEA, Wayfair, or flat-pack bed frames, desks, and dressers.', basePrice: 60.0 },
    { category: 'Handyman Services', name: 'Drywall Patch & Wall Repair', description: 'Patching holes, repairing water spots, texturing, and primer-ready sanding.', basePrice: 85.0 },
    { category: 'Handyman Services', name: 'Door Lock & Deadbolt Installation', description: 'Installation of high-security deadbolts, electronic keypads, and smart locks.', basePrice: 70.0 },
    // Lawn Mowing
    { category: 'Lawn Mowing', name: 'Lawn Mowing & Edge Trimming', description: 'Standard cut, line trimming along borders, and walkway leaf blowing.', basePrice: 50.0 },
    { category: 'Lawn Mowing', name: 'Fall Yard & Leaf Cleanup', description: 'Raking, mulching, flower bed cleanup, and seasonal branch clearing.', basePrice: 95.0 },
    // Tutoring
    { category: 'Tutoring', name: 'K-12 Math & Science Tutoring', description: 'One-on-one tailored coaching in Algebra, Geometry, Biology, and Physics.', basePrice: 45.0 },
    // Beauty Services
    { category: 'Beauty Services', name: 'At-Home Haircut & Styling', description: 'Personalized haircut, blowout, and styling in the comfort of your own home.', basePrice: 55.0 },
    // Pet Care
    { category: 'Pet Care', name: 'Dog Walking (45 min)', description: 'Energetic, safe outdoor walk with GPS route tracking, water refill, and photo update.', basePrice: 30.0 },
  ];

  const services = {};
  for (const s of servicesData) {
    const created = await prisma.service.create({
      data: {
        categoryId: categories[s.category].id,
        name: s.name,
        description: s.description,
        basePrice: s.basePrice,
        isActive: true,
      },
    });
    services[s.name] = created;
  }
  console.log(`Created ${servicesData.length} Services.`);

  // 5. Provider Services (offered by providers with custom pricing)
  // Alex Rodriguez offers plumbing, electrical, and handyman
  const alexServices = [
    { serviceName: 'Faucet & Pipe Leak Repair', price: 110.0 },
    { serviceName: 'Drain Unclogging & Cleaning', price: 95.0 },
    { serviceName: 'Light Fixture & Fan Installation', price: 85.0 },
    { serviceName: 'Outlet & Switch Replacement', price: 70.0 },
    { serviceName: 'Furniture Assembly', price: 55.0 },
    { serviceName: 'Drywall Patch & Wall Repair', price: 80.0 },
  ];
  for (const item of alexServices) {
    await prisma.providerService.create({
      data: {
        providerId: providerUser1.providerProfile.id,
        serviceId: services[item.serviceName].id,
        price: item.price,
        isActive: true,
      },
    });
  }

  // Sarah Jenkins offers cleaning services
  const sarahServices = [
    { serviceName: 'Standard Home Cleaning', price: 90.0 },
    { serviceName: 'Deep Cleaning Service', price: 175.0 },
    { serviceName: 'Move-in / Move-out Cleaning', price: 235.0 },
  ];
  for (const item of sarahServices) {
    await prisma.providerService.create({
      data: {
        providerId: providerUser2.providerProfile.id,
        serviceId: services[item.serviceName].id,
        price: item.price,
        isActive: true,
      },
    });
  }

  // David Chen offers computer repair
  const davidServices = [
    { serviceName: 'Virus & Malware Removal', price: 70.0 },
    { serviceName: 'Laptop Screen & Battery Replacement', price: 125.0 },
    { serviceName: 'Home Wi-Fi & Network Setup', price: 95.0 },
  ];
  for (const item of davidServices) {
    await prisma.providerService.create({
      data: {
        providerId: providerUser3.providerProfile.id,
        serviceId: services[item.serviceName].id,
        price: item.price,
        isActive: true,
      },
    });
  }

  console.log('Created Provider Services listings.');

  // 6. Seed Sample Orders with realistic lifecycles & events
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // Order 1: COMPLETED with 5-star review (Sarah - Deep Cleaning)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261020-1001',
      customerId: customer1.id,
      serviceId: services['Deep Cleaning Service'].id,
      providerId: providerUser2.id,
      serviceNameSnapshot: 'Deep Cleaning Service',
      servicePrice: 175.0,
      serviceAddress: '742 Evergreen Terrace, Springfield',
      scheduledAt: daysAgo(5),
      customerInstructions: 'Please focus on the kitchen oven and master bathroom tiles.',
      status: 'COMPLETED',
      createdAt: daysAgo(7),
      acceptedAt: daysAgo(6),
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      customerConfirmedAt: daysAgo(5),
    },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order1.id, actorUserId: customer1.id, eventType: 'ORDER_CREATED', oldStatus: null, newStatus: 'PENDING', note: 'Order created', createdAt: daysAgo(7) },
      { orderId: order1.id, actorUserId: providerUser2.id, eventType: 'ORDER_ACCEPTED', oldStatus: 'PENDING', newStatus: 'ACCEPTED', note: 'Accepted by SparkleClean Pros', createdAt: daysAgo(6) },
      { orderId: order1.id, actorUserId: providerUser2.id, eventType: 'SERVICE_STARTED', oldStatus: 'ACCEPTED', newStatus: 'IN_PROGRESS', note: 'Provider arrived on site', createdAt: daysAgo(5) },
      { orderId: order1.id, actorUserId: providerUser2.id, eventType: 'SERVICE_COMPLETED', oldStatus: 'IN_PROGRESS', newStatus: 'COMPLETED', note: 'Clean complete and sanitized', createdAt: daysAgo(5) },
      { orderId: order1.id, actorUserId: customer1.id, eventType: 'CUSTOMER_CONFIRMED', oldStatus: 'COMPLETED', newStatus: 'COMPLETED', note: 'Customer confirmed completion', createdAt: daysAgo(5) },
      { orderId: order1.id, actorUserId: customer1.id, eventType: 'REVIEW_SUBMITTED', oldStatus: 'COMPLETED', newStatus: 'COMPLETED', note: 'Customer rated 5/5 stars', createdAt: daysAgo(4) },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 175.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'COMPLETED',
      transactionReference: 'TX-SRV-20261020-1001',
      createdAt: daysAgo(7),
    },
  });

  await prisma.review.create({
    data: {
      orderId: order1.id,
      customerId: customer1.id,
      providerId: providerUser2.id,
      rating: 5,
      comment: 'Sarah and her team did a phenomenal job! My house has never been cleaner. Baseboards and oven look brand new.',
      createdAt: daysAgo(4),
    },
  });

  // Order 2: COMPLETED with 5-star review (Alex - Faucet Repair)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261021-1002',
      customerId: customer1.id,
      serviceId: services['Faucet & Pipe Leak Repair'].id,
      providerId: providerUser1.id,
      serviceNameSnapshot: 'Faucet & Pipe Leak Repair',
      servicePrice: 110.0,
      serviceAddress: '742 Evergreen Terrace, Springfield',
      scheduledAt: daysAgo(3),
      customerInstructions: 'Kitchen sink trap has a steady drip under the cabinet.',
      status: 'COMPLETED',
      createdAt: daysAgo(4),
      acceptedAt: daysAgo(4),
      startedAt: daysAgo(3),
      completedAt: daysAgo(3),
      customerConfirmedAt: daysAgo(3),
    },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order2.id, actorUserId: customer1.id, eventType: 'ORDER_CREATED', oldStatus: null, newStatus: 'PENDING', note: 'Order created', createdAt: daysAgo(4) },
      { orderId: order2.id, actorUserId: providerUser1.id, eventType: 'ORDER_ACCEPTED', oldStatus: 'PENDING', newStatus: 'ACCEPTED', note: 'Accepted by Apex Home & Repair', createdAt: daysAgo(4) },
      { orderId: order2.id, actorUserId: providerUser1.id, eventType: 'SERVICE_STARTED', oldStatus: 'ACCEPTED', newStatus: 'IN_PROGRESS', note: 'Alex began diagnostics', createdAt: daysAgo(3) },
      { orderId: order2.id, actorUserId: providerUser1.id, eventType: 'SERVICE_COMPLETED', oldStatus: 'IN_PROGRESS', newStatus: 'COMPLETED', note: 'Replaced rubber gasket and tested pressure', createdAt: daysAgo(3) },
      { orderId: order2.id, actorUserId: customer1.id, eventType: 'CUSTOMER_CONFIRMED', oldStatus: 'COMPLETED', newStatus: 'COMPLETED', note: 'Verified no leaks', createdAt: daysAgo(3) },
      { orderId: order2.id, actorUserId: customer1.id, eventType: 'REVIEW_SUBMITTED', oldStatus: 'COMPLETED', newStatus: 'COMPLETED', note: 'Customer rated 5/5 stars', createdAt: daysAgo(2) },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 110.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'COMPLETED',
      transactionReference: 'TX-SRV-20261021-1002',
      createdAt: daysAgo(4),
    },
  });

  await prisma.review.create({
    data: {
      orderId: order2.id,
      customerId: customer1.id,
      providerId: providerUser1.id,
      rating: 5,
      comment: 'Alex arrived right on schedule and had the replacement pipe parts in his truck. Professional and polite!',
      createdAt: daysAgo(2),
    },
  });

  // Order 3: COMPLETED with 4-star review (David - Laptop Screen)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261022-1003',
      customerId: customer2.id,
      serviceId: services['Laptop Screen & Battery Replacement'].id,
      providerId: providerUser3.id,
      serviceNameSnapshot: 'Laptop Screen & Battery Replacement',
      servicePrice: 125.0,
      serviceAddress: '1204 Elm Street, Springfield',
      scheduledAt: daysAgo(2),
      customerInstructions: 'Dell XPS 15 screen cracked, needs replacement panel.',
      status: 'COMPLETED',
      createdAt: daysAgo(3),
      acceptedAt: daysAgo(3),
      startedAt: daysAgo(2),
      completedAt: daysAgo(2),
      customerConfirmedAt: daysAgo(2),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: 125.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'COMPLETED',
      transactionReference: 'TX-SRV-20261022-1003',
      createdAt: daysAgo(3),
    },
  });

  await prisma.review.create({
    data: {
      orderId: order3.id,
      customerId: customer2.id,
      providerId: providerUser3.id,
      rating: 4,
      comment: 'Very skilled technician. Replaced the screen cleanly. Took a few hours longer than estimated but great result.',
      createdAt: daysAgo(1),
    },
  });

  // Order 4: IN_PROGRESS (Sarah - Standard Home Cleaning)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261024-1004',
      customerId: customer2.id,
      serviceId: services['Standard Home Cleaning'].id,
      providerId: providerUser2.id,
      serviceNameSnapshot: 'Standard Home Cleaning',
      servicePrice: 90.0,
      serviceAddress: '1204 Elm Street, Springfield',
      scheduledAt: now,
      customerInstructions: 'Key is in the lockbox by the side door, code 4821.',
      status: 'IN_PROGRESS',
      createdAt: daysAgo(1),
      acceptedAt: daysAgo(1),
      startedAt: now,
    },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order4.id, actorUserId: customer2.id, eventType: 'ORDER_CREATED', oldStatus: null, newStatus: 'PENDING', note: 'Order created', createdAt: daysAgo(1) },
      { orderId: order4.id, actorUserId: providerUser2.id, eventType: 'ORDER_ACCEPTED', oldStatus: 'PENDING', newStatus: 'ACCEPTED', note: 'Accepted by SparkleClean Pros', createdAt: daysAgo(1) },
      { orderId: order4.id, actorUserId: providerUser2.id, eventType: 'SERVICE_STARTED', oldStatus: 'ACCEPTED', newStatus: 'IN_PROGRESS', note: 'Cleaning currently in progress', createdAt: now },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: 90.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      transactionReference: 'TX-SRV-20261024-1004',
      createdAt: daysAgo(1),
    },
  });

  // Order 5: ACCEPTED (Alex - Outlet Replacement)
  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261025-1005',
      customerId: customer3.id,
      serviceId: services['Outlet & Switch Replacement'].id,
      providerId: providerUser1.id,
      serviceNameSnapshot: 'Outlet & Switch Replacement',
      servicePrice: 70.0,
      serviceAddress: '88 Oak Ridge Way, Springfield',
      scheduledAt: daysAhead(1),
      customerInstructions: 'Install two GFCI outlets near the laundry sink.',
      status: 'ACCEPTED',
      createdAt: daysAgo(1),
      acceptedAt: daysAgo(1),
    },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order5.id, actorUserId: customer3.id, eventType: 'ORDER_CREATED', oldStatus: null, newStatus: 'PENDING', note: 'Order created', createdAt: daysAgo(1) },
      { orderId: order5.id, actorUserId: providerUser1.id, eventType: 'ORDER_ACCEPTED', oldStatus: 'PENDING', newStatus: 'ACCEPTED', note: 'Alex accepted appointment', createdAt: daysAgo(1) },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order5.id,
      amount: 70.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      transactionReference: 'TX-SRV-20261025-1005',
      createdAt: daysAgo(1),
    },
  });

  // Order 6: PENDING (Open marketplace request for Standard Cleaning)
  const order6 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261025-1006',
      customerId: customer3.id,
      serviceId: services['Standard Home Cleaning'].id,
      providerId: null,
      serviceNameSnapshot: 'Standard Home Cleaning',
      servicePrice: 85.0,
      serviceAddress: '88 Oak Ridge Way, Springfield',
      scheduledAt: daysAhead(2),
      customerInstructions: 'Available all morning Saturday. Two-bedroom condo.',
      status: 'PENDING',
      createdAt: now,
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order6.id,
      actorUserId: customer3.id,
      eventType: 'ORDER_CREATED',
      oldStatus: null,
      newStatus: 'PENDING',
      note: 'Open booking request created',
      createdAt: now,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order6.id,
      amount: 85.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      transactionReference: 'TX-SRV-20261025-1006',
      createdAt: now,
    },
  });

  // Order 7: CANCELLED
  const order7 = await prisma.order.create({
    data: {
      orderNumber: 'SRV-20261019-1007',
      customerId: customer2.id,
      serviceId: services['Furniture Assembly'].id,
      providerId: null,
      serviceNameSnapshot: 'Furniture Assembly',
      servicePrice: 60.0,
      serviceAddress: '1204 Elm Street, Springfield',
      scheduledAt: daysAgo(6),
      status: 'CANCELLED',
      createdAt: daysAgo(7),
      cancelledAt: daysAgo(6),
      cancelledBy: 'CUSTOMER',
      cancellationReason: 'Store delivery was delayed by two weeks.',
    },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order7.id, actorUserId: customer2.id, eventType: 'ORDER_CREATED', oldStatus: null, newStatus: 'PENDING', note: 'Created', createdAt: daysAgo(7) },
      { orderId: order7.id, actorUserId: customer2.id, eventType: 'ORDER_CANCELLED', oldStatus: 'PENDING', newStatus: 'CANCELLED', note: 'Store delivery delayed', createdAt: daysAgo(6) },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order7.id,
      amount: 60.0,
      currency: 'USD',
      paymentMethod: 'CARD',
      paymentStatus: 'REFUNDED',
      transactionReference: 'TX-SRV-20261019-1007',
      createdAt: daysAgo(7),
    },
  });

  console.log('Seeded sample orders, events, reviews, and payments.');
  console.log('Database seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
