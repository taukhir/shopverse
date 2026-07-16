import { Page, Route } from '@playwright/test';

const now = '2026-07-16T10:00:00.000Z';

const products = [
  {
    productId: 101,
    productName: 'Wireless Keyboard',
    unitPrice: 2499,
    available: true,
    imageUrl: '/mock/product-keyboard.svg',
    imageKey: 'products/keyboard.svg',
    category: 'Tech',
    brand: 'Cobalt',
    model: 'Keys',
    description: 'A compact wireless keyboard for everyday work.',
    availableQuantity: 12,
    reservedQuantity: 2,
  },
  {
    productId: 102,
    productName: 'USB-C Dock',
    unitPrice: 5299,
    available: true,
    imageUrl: '/mock/product-dock.svg',
    imageKey: 'products/dock.svg',
    category: 'Tech',
    brand: 'Cobalt',
    model: 'Dock',
    description: 'A simple desk dock for modern laptops.',
    availableQuantity: 4,
    reservedQuantity: 1,
  },
  {
    productId: 103,
    productName: 'Noise Cancelling Headphones',
    unitPrice: 8999,
    available: false,
    imageUrl: '/mock/product-headphones.svg',
    imageKey: 'products/headphones.svg',
    category: 'Audio',
    brand: 'Cobalt',
    model: 'Quiet',
    description: 'Wireless headphones with active noise cancellation.',
    availableQuantity: 0,
    reservedQuantity: 0,
  },
];

const order = {
  id: 9001,
  orderNumber: 'WEB-ORD-9001',
  correlationId: 'web-e2e-correlation',
  idempotencyKey: 'web-e2e-key',
  customerUsername: 'customer1',
  status: 'CONFIRMED',
  totalAmount: 2499,
  createdAt: now,
  shippingAddress: {
    recipientName: 'Customer One',
    phoneNumber: '+910000000001',
    line1: 'Demo Street 1',
    line2: 'Floor 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'IN',
  },
  items: [{ productId: 101, productName: 'Wireless Keyboard', quantity: 1, unitPrice: 2499 }],
};

const timeline = [
  { orderNumber: order.orderNumber, correlationId: order.correlationId, stage: 'ORDER_CREATED', detail: 'Order accepted', occurredAt: now },
  { orderNumber: order.orderNumber, correlationId: order.correlationId, stage: 'PAYMENT_CAPTURED', detail: 'Payment captured', occurredAt: now },
  { orderNumber: order.orderNumber, correlationId: order.correlationId, stage: 'ORDER_CONFIRMED', detail: 'Order confirmed', occurredAt: now },
];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function token(username: string, roles: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: username,
    roles,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  return `${header}.${payload}.signature`;
}

export async function mockShopverseApis(page: Page) {
  await page.route('**/mock/*.svg', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#eef1ff"/><rect x="36" y="48" width="128" height="64" rx="12" fill="#11162b"/><circle cx="150" cy="118" r="10" fill="#7384ff"/></svg>',
  }));

  await page.route('**/auth/login', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { username?: string };
    const isAdmin = body.username === 'admin';
    return json(route, { token: token(body.username ?? 'customer1', isAdmin ? 'ROLE_ADMIN ROLE_CUSTOMER' : 'ROLE_CUSTOMER') });
  });

  await page.route('**/api/v1/users/me', (route) => json(route, {
    id: 1,
    username: 'customer1',
    email: 'customer1@shopverse.local',
    firstName: 'Customer',
    lastName: 'One',
    phoneNumber: '+910000000001',
    status: 'ACTIVE',
    roles: [{ roleName: 'ROLE_CUSTOMER' }],
  }));

  await page.route('**/api/v1/users/me/addresses', (route) => json(route, [{
    id: 501,
    label: 'Home',
    recipientName: 'Customer One',
    phoneNumber: '+910000000001',
    line1: 'Demo Street 1',
    line2: 'Floor 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'IN',
    defaultAddress: true,
  }]));

  await page.route('**/api/v1/cart', (route) => {
    if (route.request().method() === 'GET') return json(route, { items: [{ productId: 101, quantity: 1 }], valid: true, message: 'ok' });
    return json(route, { items: [{ productId: 101, quantity: 1 }], valid: true, message: 'ok' });
  });
  await page.route('**/api/v1/cart/merge', (route) => json(route, { items: [{ productId: 101, quantity: 1 }], valid: true, message: 'merged' }));
  await page.route('**/api/v1/cart/validate', (route) => json(route, { items: [{ productId: 101, quantity: 1 }], valid: true, message: 'valid' }));

  await page.route('**/api/v1/inventory/public/items', (route) => json(route, products));
  await page.route('**/api/v1/inventory/public/items/101', (route) => json(route, products[0]));
  await page.route('**/api/v1/inventory/public/items/101/related', (route) => json(route, products.slice(1)));
  await page.route('**/api/v1/inventory/public/categories', (route) => json(route, ['Tech', 'Audio']));

  await page.route('**/api/v1/orders/9001/timeline', (route) => json(route, timeline));
  await page.route('**/api/v1/orders/9001', (route) => json(route, order));
  await page.route('**/api/v1/orders/checkout', (route) => json(route, { orderNumber: order.orderNumber }));
  await page.route('**/api/v1/orders', (route) => {
    if (route.request().method() === 'GET') return json(route, [order]);
    return route.fallback();
  });
  await page.route('**/api/v1/payments/orders/WEB-ORD-9001', (route) => json(route, {
    id: 7001,
    orderNumber: order.orderNumber,
    correlationId: order.correlationId,
    amount: 2499,
    status: 'CAPTURED',
    paymentReference: 'pay-web-9001',
    failureReason: null,
    createdAt: now,
    updatedAt: now,
  }));

  await page.route('**/api/v1/orders/admin/all', (route) => json(route, [order]));
  await page.route('**/api/v1/users?size=12', (route) => json(route, {
    content: [{
      id: 1,
      username: 'customer1',
      email: 'customer1@shopverse.local',
      firstName: 'Customer',
      lastName: 'One',
      status: 'ACTIVE',
      roles: ['ROLE_CUSTOMER'],
    }],
    totalElements: 1,
  }));
  await page.route('**/api/v1/payments/admin', (route) => json(route, [{
    id: 7001,
    orderNumber: order.orderNumber,
    amount: 2499,
    status: 'CAPTURED',
    failureReason: null,
    updatedAt: now,
  }]));
  await page.route('**/api/v1/*/admin/dead-letters', (route) => json(route, []));
  await page.route('**/api/v1/inventory/admin/reservations/orders/WEB-ORD-9001', (route) => json(route, {
    orderNumber: order.orderNumber,
    productId: 101,
    quantity: 1,
    status: 'RESERVED',
    expiresAt: now,
  }));
  await page.route('**/api/v1/admin/audit-events', (route) => json(route, {
    content: [
      {
        id: 1,
        area: 'ORDERS',
        action: 'ORDER_PACKED',
        actor: 'admin',
        result: 'SUCCESS',
        occurredAt: now,
        subjectType: 'ORDER',
        subjectId: order.orderNumber,
        description: 'Order moved into fulfillment.',
        metadata: { sourceService: 'order-service' },
      },
      {
        id: 2,
        area: 'INVENTORY',
        action: 'RESERVATION_RELEASED',
        actor: 'system',
        result: 'SUCCESS',
        occurredAt: now,
        subjectType: 'RESERVATION',
        subjectId: order.orderNumber,
        description: 'Inventory reservation updated.',
        metadata: { sourceService: 'inventory-service' },
      },
      {
        id: 3,
        area: 'PAYMENTS',
        action: 'PAYMENT_CAPTURED',
        actor: 'system',
        result: 'SUCCESS',
        occurredAt: now,
        subjectType: 'PAYMENT',
        subjectId: order.orderNumber,
        description: 'Payment state changed.',
        metadata: { sourceService: 'payment-service' },
      },
    ],
    totalElements: 3,
  }));
}

export async function signIn(page: Page, username = 'customer1') {
  if (!page.url().includes('/login')) {
    await page.goto('/login');
  }
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(username === 'admin' ? 'Admin@123' : 'Customer@123');
  await page.getByRole('button', { name: /sign in/i }).click();
}
