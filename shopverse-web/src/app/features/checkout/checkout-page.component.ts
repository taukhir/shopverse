import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { formatInr } from '../../shared/utils/formatters';
import { AccountApiService, UserAddress } from '../account/account-api.service';
import { OrdersApiService, ShippingAddress } from '../orders/orders-api.service';

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
  private readonly accountApi = inject(AccountApiService);
  private readonly toast = inject(ToastService);
  protected readonly loading = signal(false);
  protected readonly addressesLoading = signal(false);
  protected readonly error = signal('');
  protected readonly addressError = signal('');
  protected readonly success = signal('');
  protected readonly receipt = signal<CheckoutReceipt | null>(null);
  protected readonly addresses = signal<UserAddress[]>([]);
  protected readonly selectedAddressId = signal<number | null>(null);
  protected readonly selectedAddress = computed(() => this.addresses().find((address) => address.id === this.selectedAddressId()) ?? this.addresses().find((address) => address.defaultAddress) ?? this.addresses()[0] ?? null);

  constructor() {
    this.loadAddresses();
  }

  protected loadAddresses(): void {
    this.addressesLoading.set(true);
    this.addressError.set('');
    this.accountApi.listAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const selected = addresses.find((address) => address.defaultAddress) ?? addresses[0] ?? null;
        this.selectedAddressId.set(selected?.id ?? null);
        this.addressesLoading.set(false);
      },
      error: () => {
        this.addressError.set('We could not load your saved addresses. Add or refresh your account address before checkout.');
        this.addressesLoading.set(false);
      },
    });
  }

  protected placeOrder(): void {
    if (this.loading()) return;
    const item = this.cart.items()[0];
    if (!item) return;
    const address = this.selectedAddress();
    if (!address) {
      this.error.set('Add a delivery address before placing this order.');
      this.toast.error('Delivery address required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.receipt.set(null);
    const idempotencyKey = `web-${item.productId}-${crypto.randomUUID()}`;
    this.ordersApi.checkout([{ productId: item.productId, quantity: item.quantity }], idempotencyKey, this.toShippingAddress(address)).subscribe({
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

  protected selectAddress(id: string): void {
    this.selectedAddressId.set(Number(id));
  }

  protected formatAddress(address: UserAddress | ShippingAddress): string {
    return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
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

  private toShippingAddress(address: UserAddress): ShippingAddress {
    return {
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber ?? '',
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };
  }
}
