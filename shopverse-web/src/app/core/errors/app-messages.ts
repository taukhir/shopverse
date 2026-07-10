export const APP_MESSAGES = {
  errors: {
    catalogUnavailable: 'Catalog is unavailable. Please try again.',
    checkoutFailed: 'We could not create the order. Please try again.',
    checkoutSessionExpired: 'Your session expired. Please sign in again to place this order.',
    checkoutInventoryUnavailable: 'Inventory could not confirm this item. Please review the product or try again shortly.',
    checkoutConflict: 'This order request was already processed or conflicts with the current cart state. Refresh your cart and try again.',
    checkoutServiceUnavailable: 'Checkout is temporarily unavailable. Your cart is saved; please try again in a moment.',
    accountUpdateFailed: 'We could not update your account details. Check the email/phone format and try again.',
    inventoryUnavailable: 'Inventory is unavailable.',
    inventorySaveFailed: 'The item could not be saved. Check required values and permissions.',
    paymentsUnavailable: 'Payments are unavailable. Confirm Payment Service is running and this account has admin access.',
    recoveryUnavailable: 'Recovery data is unavailable. Confirm backend services are running and this account has admin access.',
    operationsUnavailable: 'Operations data is unavailable. Confirm the backend services are running and this account has administrator permissions.',
  },
  warnings: {
    partialAdminData: 'Some operational widgets may be empty if Inventory or Payment Service is offline or has no records yet.',
  },
} as const;
