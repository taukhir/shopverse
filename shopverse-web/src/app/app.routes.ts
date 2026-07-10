import { Routes } from '@angular/router';

import { adminGuard, authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', title: 'Sign in - ShopVerse', loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent) },
  { path: 'register', title: 'Create account - ShopVerse', loadComponent: () => import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent) },
  {
    path: '',
    loadComponent: () => import('./layouts/customer-layout/customer-layout.component').then((m) => m.CustomerLayoutComponent),
    data: { preload: true },
    children: [
      { path: '', title: 'ShopVerse - Modern essentials', loadComponent: () => import('./features/storefront/storefront.component').then((m) => m.StorefrontComponent), data: { preload: true } },
      { path: 'products', title: 'Products - ShopVerse', loadComponent: () => import('./features/catalog/catalog-page.component').then((m) => m.CatalogPageComponent), data: { preload: true } },
      { path: 'products/:id', title: 'Product details - ShopVerse', loadComponent: () => import('./features/catalog/product-detail-page.component').then((m) => m.ProductDetailPageComponent), data: { preload: true } },
      { path: 'cart', title: 'Cart - ShopVerse', loadComponent: () => import('./features/cart/cart-page.component').then((m) => m.CartPageComponent), data: { preload: true } },
      { path: 'checkout', title: 'Checkout - ShopVerse', loadComponent: () => import('./features/checkout/checkout-page.component').then((m) => m.CheckoutPageComponent), canActivate: [authGuard], data: { preload: true } },
      { path: 'orders', title: 'Orders - ShopVerse', loadComponent: () => import('./features/orders/orders-page.component').then((m) => m.OrdersPageComponent), canActivate: [authGuard], data: { preload: true } },
      { path: 'orders/:id', title: 'Order details - ShopVerse', loadComponent: () => import('./features/orders/order-detail-page.component').then((m) => m.OrderDetailPageComponent), canActivate: [authGuard], data: { preload: true } },
      { path: 'notifications', title: 'Notifications - ShopVerse', loadComponent: () => import('./features/notifications/notifications-page.component').then((m) => m.NotificationsPageComponent), canActivate: [authGuard], data: { preload: true } },
      { path: 'account', title: 'Account - ShopVerse', loadComponent: () => import('./features/account/account-page.component').then((m) => m.AccountPageComponent), canActivate: [authGuard], data: { preload: true } },
      { path: 'unauthorized', title: 'Access required - ShopVerse', loadComponent: () => import('./features/auth/unauthorized-page.component').then((m) => m.UnauthorizedPageComponent), canActivate: [authGuard] },
    ],
  },
  { path: 'admin', pathMatch: 'full', title: 'Admin - ShopVerse', loadComponent: () => import('./features/admin/admin-page.component').then((m) => m.AdminPageComponent), canActivate: [adminGuard] },
  { path: 'admin/orders/:id', title: 'Admin order detail - ShopVerse', loadComponent: () => import('./features/admin/admin-order-detail.component').then((m) => m.AdminOrderDetailComponent), canActivate: [adminGuard] },
  { path: 'admin/inventory', title: 'Inventory - ShopVerse', loadComponent: () => import('./features/admin/inventory-admin.component').then((m) => m.InventoryAdminComponent), canActivate: [adminGuard] },
  { path: 'admin/payments', title: 'Payments - ShopVerse', loadComponent: () => import('./features/admin/payment-admin.component').then((m) => m.PaymentAdminComponent), canActivate: [adminGuard] },
  { path: 'admin/recovery', title: 'Recovery - ShopVerse', loadComponent: () => import('./features/admin/recovery-admin.component').then((m) => m.RecoveryAdminComponent), canActivate: [adminGuard] },
  { path: 'admin/users/:id', title: 'User profile - ShopVerse', loadComponent: () => import('./features/admin/admin-user-detail.component').then((m) => m.AdminUserDetailComponent), canActivate: [adminGuard] },
  { path: 'admin/:section', title: 'Admin - ShopVerse', loadComponent: () => import('./features/admin/admin-page.component').then((m) => m.AdminPageComponent), canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
