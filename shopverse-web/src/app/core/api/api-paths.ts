export const API_PATHS = {
  auth: {
    login: '/auth/login',
  },
  catalog: {
    public: '/api/v1/orders/public/catalog',
  },
  inventory: {
    publicItems: '/api/v1/inventory/public/items',
    adminItems: '/api/v1/inventory/admin/items',
    reservationByOrder: (orderNumber: string) => `/api/v1/inventory/admin/reservations/orders/${orderNumber}`,
    deadLetters: '/api/v1/inventory/admin/dead-letters',
  },
  orders: {
    customer: '/api/v1/orders',
    checkout: '/api/v1/orders/checkout',
    byId: (id: number | string) => `/api/v1/orders/${id}`,
    timeline: (id: number | string) => `/api/v1/orders/${id}/timeline`,
    adminAll: '/api/v1/orders/admin/all',
    deadLetters: '/api/v1/orders/admin/dead-letters',
  },
  payments: {
    admin: '/api/v1/payments/admin',
    byOrder: (orderNumber: string) => `/api/v1/payments/orders/${orderNumber}`,
    simulation: (mode: string) => `/api/v1/payments/admin/simulation?mode=${mode}`,
    orderAction: (orderNumber: string, action: 'reconcile' | 'refund') => `/api/v1/payments/admin/orders/${orderNumber}/${action}`,
    deadLetters: '/api/v1/payments/admin/dead-letters',
  },
  users: {
    me: '/api/v1/users/me',
    register: '/api/v1/public/users/register',
    page: (size = 12) => `/api/v1/users?size=${size}`,
    byId: (id: number | string) => `/api/v1/users/${id}`,
  },
  roles: {
    page: (size = 50) => `/api/v1/roles?size=${size}`,
  },
} as const;

export const PUBLIC_API_MARKERS = ['/auth/', '/public/'] as const;
