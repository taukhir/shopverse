export const API_PATHS = {
  auth: {
    login: '/auth/login',
  },
  catalog: {
    public: '/api/v1/orders/public/catalog',
  },
  inventory: {
    publicItems: '/api/v1/inventory/public/items',
    publicItem: (productId: number | string) => `/api/v1/inventory/public/items/${productId}`,
    publicCategories: '/api/v1/inventory/public/categories',
    publicRelated: (productId: number | string) => `/api/v1/inventory/public/items/${productId}/related`,
    adminItems: '/api/v1/inventory/admin/items',
    itemImage: (productId: number) => `/api/v1/inventory/admin/items/${productId}/image`,
    reservationByOrder: (orderNumber: string) => `/api/v1/inventory/admin/reservations/orders/${orderNumber}`,
    deadLetters: '/api/v1/inventory/admin/dead-letters',
  },
  orders: {
    customer: '/api/v1/orders',
    byId: (id: number | string) => `/api/v1/orders/${id}`,
    cancel: (id: number | string) => `/api/v1/orders/${id}/cancel`,
    timeline: (id: number | string) => `/api/v1/orders/${id}/timeline`,
    adminAll: '/api/v1/orders/admin/all',
    adminCancel: (id: number | string) => `/api/v1/orders/admin/${id}/cancel`,
    adminPack: (id: number | string) => `/api/v1/orders/admin/${id}/pack`,
    adminShip: (id: number | string) => `/api/v1/orders/admin/${id}/ship`,
    adminDeliver: (id: number | string) => `/api/v1/orders/admin/${id}/deliver`,
    returnRequest: (id: number | string) => `/api/v1/orders/${id}/return-request`,
    deadLetters: '/api/v1/orders/admin/dead-letters',
  },
  checkouts: {
    root: '/api/v1/checkouts',
    byId: (checkoutId: string) => `/api/v1/checkouts/${checkoutId}`,
    placeOrder: (checkoutId: string) => `/api/v1/checkouts/${checkoutId}/place-order`,
  },
  payments: {
    admin: '/api/v1/payments/admin',
    intent: '/api/v1/payments/intent',
    byOrder: (orderNumber: string) => `/api/v1/payments/orders/${orderNumber}`,
    retry: (orderNumber: string) => `/api/v1/payments/orders/${orderNumber}/retry`,
    refund: (orderNumber: string) => `/api/v1/payments/orders/${orderNumber}/refund`,
    simulation: (mode: string) => `/api/v1/payments/admin/simulation?mode=${mode}`,
    orderAction: (orderNumber: string, action: 'reconcile' | 'refund') => `/api/v1/payments/admin/orders/${orderNumber}/${action}`,
    deadLetters: '/api/v1/payments/admin/dead-letters',
  },
  accounts: {
    current: '/api/v1/accounts/current',
    addresses: '/api/v1/accounts/current/addresses',
    addressById: (id: number | string) => `/api/v1/accounts/current/addresses/${id}`,
  },
  users: {
    register: '/api/v1/public/users/register',
  },
  adminUsers: {
    page: (size = 12) => `/api/v1/admin/users?size=${size}`,
    byId: (id: number | string) => `/api/v1/admin/users/${id}`,
  },
  groups: {
    page: (size = 20, page = 0, search = '') => `/api/v1/groups?size=${size}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    root: '/api/v1/groups',
    byId: (id: number | string) => `/api/v1/groups/${id}`,
    members: (id: number | string, page = 0, size = 20) => `/api/v1/groups/${id}/members?page=${page}&size=${size}`,
    member: (groupId: number | string, userId: number | string) => `/api/v1/groups/${groupId}/members/${userId}`,
    role: (groupId: number | string, roleId: number | string) => `/api/v1/groups/${groupId}/roles/${roleId}`,
  },
  roles: {
    page: (size = 50, page = 0) => `/api/v1/roles?size=${size}&page=${page}`,
    root: '/api/v1/roles',
    byId: (id: number | string) => `/api/v1/roles/${id}`,
  },
  permissions: {
    page: (size = 100, page = 0) => `/api/v1/permissions?size=${size}&page=${page}`,
    root: '/api/v1/permissions',
    byId: (id: number | string) => `/api/v1/permissions/${id}`,
  },
  cart: {
    root: '/api/v1/cart',
    merge: '/api/v1/cart/merge',
    validate: '/api/v1/cart/validate',
    item: (productId: number | string) => `/api/v1/cart/items/${productId}`,
  },
  admin: {
    auditEvents: '/api/v1/admin/audit-events',
    auditEvent: (id: number | string) => `/api/v1/admin/audit-events/${id}`,
  },
} as const;

export const PUBLIC_API_MARKERS = ['/auth/', '/public/'] as const;
