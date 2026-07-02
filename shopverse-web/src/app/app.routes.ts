import { Routes } from '@angular/router';

import { AccountPageComponent } from './features/account/account-page.component';
import { AdminPageComponent } from './features/admin/admin-page.component';
import { AdminUserDetailComponent } from './features/admin/admin-user-detail.component';
import { InventoryAdminComponent } from './features/admin/inventory-admin.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { CatalogPageComponent } from './features/catalog/catalog-page.component';
import { CartPageComponent } from './features/cart/cart-page.component';
import { CheckoutPageComponent } from './features/checkout/checkout-page.component';
import { OrderDetailPageComponent } from './features/orders/order-detail-page.component';
import { OrdersPageComponent } from './features/orders/orders-page.component';
import { StorefrontComponent } from './features/storefront/storefront.component';
import { adminGuard, authGuard } from './core/auth/auth.guard';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';

export const routes: Routes = [
  { path: 'login', title: 'Sign in - ShopVerse', component: LoginPageComponent },
  {
    path: '', component: CustomerLayoutComponent,
    children: [
      { path: '', title: 'ShopVerse - Modern essentials', component: StorefrontComponent },
      { path: 'products', title: 'Products - ShopVerse', component: CatalogPageComponent },
      { path: 'cart', title: 'Cart - ShopVerse', component: CartPageComponent },
      { path: 'checkout', title: 'Checkout - ShopVerse', component: CheckoutPageComponent, canActivate: [authGuard] },
      { path: 'orders', title: 'Orders - ShopVerse', component: OrdersPageComponent, canActivate: [authGuard] },
      { path: 'orders/:id', title: 'Order details - ShopVerse', component: OrderDetailPageComponent, canActivate: [authGuard] },
      { path: 'account', title: 'Account - ShopVerse', component: AccountPageComponent, canActivate: [authGuard] },
    ],
  },
  { path: 'admin', pathMatch: 'full', title: 'Admin - ShopVerse', component: AdminPageComponent, canActivate: [adminGuard] },
  { path: 'admin/inventory', title: 'Inventory - ShopVerse', component: InventoryAdminComponent, canActivate: [adminGuard] },
  { path: 'admin/users/:id', title: 'User profile - ShopVerse', component: AdminUserDetailComponent, canActivate: [adminGuard] },
  { path: 'admin/:section', title: 'Admin - ShopVerse', component: AdminPageComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
