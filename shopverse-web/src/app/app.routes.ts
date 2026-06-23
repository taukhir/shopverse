import { Routes } from '@angular/router';

import { AdminPageComponent } from './features/admin/admin-page.component';
import { CatalogPageComponent } from './features/catalog/catalog-page.component';
import { CartPageComponent } from './features/cart/cart-page.component';
import { PlaceholderPageComponent } from './features/placeholder/placeholder-page.component';
import { StorefrontComponent } from './features/storefront/storefront.component';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', title: 'ShopVerse - Modern essentials', component: StorefrontComponent },
      { path: 'products', title: 'Products - ShopVerse', component: CatalogPageComponent },
      { path: 'cart', title: 'Cart - ShopVerse', component: CartPageComponent },
      { path: 'checkout', title: 'Checkout - ShopVerse', component: PlaceholderPageComponent, data: { eyebrow: 'Checkout', title: 'A clear path to confirmation.', description: 'Checkout will use the backend idempotency key and show the live SAGA result.' } },
      { path: 'orders', title: 'Orders - ShopVerse', component: PlaceholderPageComponent, data: { eyebrow: 'Orders', title: 'Your order journey.', description: 'Order history and the event timeline will be added after gateway integration.' } },
      { path: 'account', title: 'Account - ShopVerse', component: PlaceholderPageComponent, data: { eyebrow: 'Account', title: 'Your ShopVerse account.', description: 'Sign-in and account preferences will be connected to Auth and User Service.' } },
    ],
  },
  { path: 'admin', pathMatch: 'full', title: 'Admin - ShopVerse', component: AdminPageComponent },
  { path: 'admin/:section', title: 'Admin - ShopVerse', component: AdminPageComponent },
  { path: '**', redirectTo: '' },
];
