import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  protected readonly cart = inject(CartService);
  private readonly http = inject(HttpClient);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected placeOrder(): void {
    const item = this.cart.items()[0];
    if (!item) return;
    this.loading.set(true);
    this.error.set('');
    const headers = new HttpHeaders({ 'Idempotency-Key': `web-${item.productId}-${crypto.randomUUID()}` });
    this.http.post<{ orderNumber: string }>('/api/v1/orders/checkout', { items: [{ productId: item.productId, quantity: item.quantity }] }, { headers }).subscribe({
      next: (order) => {
        this.success.set(order.orderNumber);
        this.cart.clear();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('We could not create the order. Please try again.');
        this.loading.set(false);
      },
    });
  }

  protected price(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }
}
