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

export async function mockShopverseApis(page: Page, options: { failFirstPlaceOrder?: boolean } = {}) {
  let browserSession: { authenticated: boolean; username: string; roles: string[]; expiresAt: string } | null = null;
  let addressRecords = [{
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
  }];
  let profile = { id: 1, username: 'customer1', email: 'customer1@shopverse.local', firstName: 'Customer', lastName: 'One', phoneNumber: '+910000000001', status: 'ACTIVE', roles: [{ roleName: 'ROLE_CUSTOMER' }] };
  let submittedCheckoutItems: Array<{ productId: number; quantity: number }> = [];
  let persistedCartItems = [{ productId: 101, quantity: 1 }];
  let placeAttempts = 0;
  const reservations = [
    { id: 1, orderNumber: order.orderNumber, correlationId: order.correlationId, productId: 101, quantity: 1, status: 'RESERVED', expiresAt: now },
    { id: 2, orderNumber: order.orderNumber, correlationId: order.correlationId, productId: 102, quantity: 2, status: 'RESERVED', expiresAt: now },
  ];
  await page.route('**/mock/*.svg', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#eef1ff"/><rect x="36" y="48" width="128" height="64" rx="12" fill="#11162b"/><circle cx="150" cy="118" r="10" fill="#7384ff"/></svg>',
  }));

  await page.route('**/auth/csrf', (route) => route.fulfill({
    status: 204,
    headers: { 'set-cookie': 'XSRF-TOKEN=mock-csrf-token; Path=/; SameSite=Lax' },
  }));
  await page.route('**/auth/session', (route) => json(route, browserSession ?? {
    authenticated: false,
    username: null,
    roles: [],
    expiresAt: null,
  }));
  await page.route('**/auth/login', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { username?: string };
    const isAdmin = body.username === 'admin';
    browserSession = {
      authenticated: true,
      username: body.username ?? 'customer1',
      roles: isAdmin ? ['ROLE_ADMIN', 'ROLE_CUSTOMER'] : ['ROLE_CUSTOMER'],
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': 'SHOPVERSE_ACCESS=mock-session; Path=/; HttpOnly; SameSite=Lax' },
      body: JSON.stringify({ authenticated: true }),
    });
  });
  await page.route('**/auth/logout', (route) => {
    browserSession = null;
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/v1/public/users/register', (route) => json(route, { id: 101, username: (route.request().postDataJSON() as { username: string }).username, status: 'ACTIVE' }, 201));

  await page.route('**/api/v1/accounts/current', async (route) => {
    if (route.request().method() === 'PATCH') {
      profile = { ...profile, ...(route.request().postDataJSON() as Partial<typeof profile>) };
    }
    return json(route, profile);
  });

  await page.route('**/api/v1/accounts/current/addresses**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') return json(route, addressRecords);
    const request = route.request().postDataJSON() as Omit<(typeof addressRecords)[number], 'id'>;
    if (method === 'POST') {
      const saved = { ...request, id: 502 };
      addressRecords = [saved, ...addressRecords];
      return json(route, saved, 201);
    }
    if (method === 'PUT') {
      const id = Number(new URL(route.request().url()).pathname.split('/').at(-1));
      const saved = { ...addressRecords.find((address) => address.id === id)!, ...request, id };
      addressRecords = addressRecords.map((address) => address.id === id ? saved : address);
      return json(route, saved);
    }
    return route.fallback();
  });

  await page.route('**/api/v1/cart', (route) => {
    const method = route.request().method();
    if (method === 'GET') return json(route, { items: persistedCartItems, valid: true, message: 'ok' });
    if (method === 'PUT') persistedCartItems = (route.request().postDataJSON() as { items: typeof persistedCartItems }).items;
    return json(route, { items: persistedCartItems, valid: true, message: 'ok' });
  });
  await page.route('**/api/v1/cart/merge', (route) => {
    const localItems = (route.request().postDataJSON() as { items: typeof persistedCartItems }).items;
    const merged = new Map(persistedCartItems.map((item) => [item.productId, item.quantity]));
    for (const item of localItems) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    persistedCartItems = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
    return json(route, { items: persistedCartItems, valid: true, message: 'merged' });
  });
  await page.route('**/api/v1/cart/validate', (route) => json(route, { items: persistedCartItems, valid: true, message: 'valid' }));

  await page.route('**/api/v1/inventory/public/items', (route) => json(route, products));
  await page.route('**/api/v1/inventory/public/items/101', (route) => json(route, products[0]));
  await page.route('**/api/v1/inventory/public/items/101/related', (route) => json(route, products.slice(1)));
  await page.route('**/api/v1/inventory/public/categories', (route) => json(route, ['Tech', 'Audio']));
  await page.route('**/api/v1/roles?**', (route) => json(route, { content: [{ id: 1, roleName: 'ROLE_CUSTOMER', description: 'Customer', permissions: [{ id: 1, permissionName: 'ORDER_READ', description: 'Read orders', moduleName: 'ORDER' }] }], totalElements: 1, totalPages: 1 }));
  await page.route('**/api/v1/permissions?**', (route) => json(route, { content: [{ id: 1, permissionName: 'ORDER_READ', description: 'Read orders', moduleName: 'ORDER' }], totalElements: 1, totalPages: 1 }));
  await page.route('**/api/v1/groups?**', (route) => json(route, { content: [{ id: 1, groupName: 'Operations', description: 'Ops team', memberCount: 1, roles: [] }], totalElements: 1, totalPages: 1 }));
  await page.route('**/api/v1/groups/1/members?**', (route) => json(route, { content: [{ id: 1, username: 'admin', email: 'admin@shopverse.local', firstName: 'Admin', lastName: 'User', status: 'ACTIVE' }], totalElements: 1, totalPages: 1 }));

  await page.route('**/api/v1/orders/9001/timeline', (route) => json(route, timeline));
  await page.route('**/api/v1/orders/9001', (route) => json(route, order));
  await page.route('**/api/v1/checkouts', (route) => {
    submittedCheckoutItems = (route.request().postDataJSON() as { items: Array<{ productId: number; quantity: number }> }).items;
    const reviewedItems = submittedCheckoutItems.map((item) => ({ ...item, productName: products.find((product) => product.productId === item.productId)?.productName ?? 'Unknown', unitPrice: products.find((product) => product.productId === item.productId)?.unitPrice ?? 0 }));
    const total = reviewedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return json(route, {
    checkoutId: 'CHK-9001',
    version: 1,
    status: 'READY_TO_PLACE',
    items: reviewedItems,
    shippingAddress: order.shippingAddress,
    currency: 'INR',
    totalAmount: total,
    expiresAt: now,
    orderId: null,
  }, 201);
  });
  await page.route('**/api/v1/checkouts/*/place-order', (route) => {
    placeAttempts++;
    const body = route.request().headers()['idempotency-key'];
    if (options.failFirstPlaceOrder && placeAttempts === 1) return json(route, { detail: 'Temporary payment service failure.' }, 503);
    return json(route, { orderNumber: order.orderNumber, receivedIdempotencyKey: body, submittedItems: submittedCheckoutItems }, 201);
  });
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
  const adminOrderRecords = Array.from({ length: 17 }, (_, index) => ({
    ...order,
    id: 9100 + index,
    orderNumber: `ADM-ORD-${String(index + 1).padStart(4, '0')}`,
    customerUsername: `customer${String(index + 1).padStart(2, '0')}`,
    status: index % 2 === 0 ? 'PAYMENT_FAILED' : 'CONFIRMED',
    totalAmount: (index + 1) * 125,
  }));
  await page.route('**/api/v1/orders/admin?**', (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const status = url.searchParams.get('status') ?? 'ALL';
    const filtered = adminOrderRecords.filter((record) => {
      const matchesSearch = !search || `${record.orderNumber} ${record.customerUsername}`.toLowerCase().includes(search);
      return matchesSearch && (status === 'ALL' || record.status === status);
    });
    const content = filtered.slice(pageNumber * size, (pageNumber + 1) * size);
    const totalPages = Math.ceil(filtered.length / size);
    return json(route, {
      content,
      page: pageNumber,
      size,
      totalElements: filtered.length,
      totalPages,
      first: pageNumber === 0,
      last: pageNumber >= totalPages - 1,
    });
  });
  await page.route('**/api/v1/admin/users**', (route) => json(route, {
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
  await page.route('**/api/v1/inventory/admin/reservations/orders/WEB-ORD-9001', (route) => json(route, reservations));
  await page.route('**/api/v1/admin/audit-events?**', (route) => json(route, {
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
