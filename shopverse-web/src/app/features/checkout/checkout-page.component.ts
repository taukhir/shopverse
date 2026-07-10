import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { formatInr } from '../../shared/utils/formatters';
import { OrdersApiService } from '../orders/orders-api.service';

interface CheckoutReceipt {
  orderNumber: string;
  idempotencyKey: string;
  transactionId: string;
  placedAt: string;
  productId: number;
  productName: string;
  quantity: number;
  amount: number;
  paymentStatus: string;
}

@Component({
  selector: 'app-checkout-page',
  imports: [DatePipe, EmptyStateComponent, RouterLink],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  protected readonly cart = inject(CartService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly toast = inject(ToastService);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly receipt = signal<CheckoutReceipt | null>(null);

  protected placeOrder(): void {
    if (this.loading()) return;
    const item = this.cart.items()[0];
    if (!item) return;
    this.loading.set(true);
    this.error.set('');
    this.receipt.set(null);
    const idempotencyKey = `web-${item.productId}-${crypto.randomUUID()}`;
    this.ordersApi.checkout([{ productId: item.productId, quantity: item.quantity }], idempotencyKey).subscribe({
      next: (order) => {
        const transactionId = `txn-${order.orderNumber}`;
        this.success.set(order.orderNumber);
        this.receipt.set({
          orderNumber: order.orderNumber,
          idempotencyKey,
          transactionId,
          placedAt: new Date().toISOString(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          amount: item.price * item.quantity,
          paymentStatus: 'Pending capture',
        });
        this.cart.clear();
        this.loading.set(false);
        this.toast.success(`Order ${order.orderNumber} created.`);
      },
      error: (error: unknown) => {
        const message = this.checkoutErrorMessage(error);
        this.error.set(message);
        this.loading.set(false);
        this.toast.error(message);
      },
    });
  }

  protected async copy(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success(`${label} copied.`);
    } catch {
      this.toast.error(`Could not copy ${label}.`);
    }
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  private checkoutErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return APP_MESSAGES.errors.checkoutFailed;
    if (error.status === 401 || error.status === 403) return APP_MESSAGES.errors.checkoutSessionExpired;
    if (error.status === 409) return APP_MESSAGES.errors.checkoutConflict;
    if (error.status === 422 || error.status === 400) return APP_MESSAGES.errors.checkoutInventoryUnavailable;
    if (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500) {
      return APP_MESSAGES.errors.checkoutServiceUnavailable;
    }
    return APP_MESSAGES.errors.checkoutFailed;
  }
}
