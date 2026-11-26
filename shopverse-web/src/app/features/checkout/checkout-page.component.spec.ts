import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CartService, CartItem } from '../../core/cart/cart.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ToastService } from '../../core/feedback/toast.service';
import { AccountApiService, UserAddress } from '../account/account-api.service';
import { OrdersApiService } from '../orders/orders-api.service';
import { CheckoutPageComponent } from './checkout-page.component';

type Internal = {
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string>>;
  addressError: ReturnType<typeof signal<string>>;
  success: ReturnType<typeof signal<string>>;
  receipt: ReturnType<typeof signal<unknown>>;
  review: ReturnType<typeof signal<{ checkoutId: string; version: number } | null>>;
  addresses: ReturnType<typeof signal<UserAddress[]>>;
  selectedAddressId: ReturnType<typeof signal<number | null>>;
  selectedAddress: () => UserAddress | null;
  reviewOrder(): void;
  confirmOrder(): void;
  selectAddress(id: string): void;
  formatAddress(address: UserAddress): string;
  price(value: number): string;
  copy(value: string, label: string): Promise<void>;
};

function address(overrides: Partial<UserAddress> = {}): UserAddress {
  return {
    id: 1,
    label: 'Home',
    recipientName: 'Ahmed',
    phoneNumber: '123',
    line1: '1 Main St',
    line2: null,
    city: 'Bengaluru',
    state: 'KA',
    postalCode: '560001',
    country: 'India',
    defaultAddress: false,
    ...overrides,
  };
}

describe('CheckoutPageComponent', () => {
  let cartItems: ReturnType<typeof signal<CartItem[]>>;
  let cartStub: { items: () => CartItem[]; clear: ReturnType<typeof vi.fn> };
  let accountApiStub: { listAddresses: ReturnType<typeof vi.fn> };
  let ordersApiStub: {
    placeOrder: ReturnType<typeof vi.fn>;
    createCheckout: ReturnType<typeof vi.fn>;
    getCheckout: ReturnType<typeof vi.fn>;
    updateCheckout: ReturnType<typeof vi.fn>;
  };
  let toastStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function createComponent(addressesResponse = of<UserAddress[]>([])): Internal {
    cartItems = signal<CartItem[]>([]);
    cartStub = { items: () => cartItems(), clear: vi.fn(() => cartItems.set([])) };
    accountApiStub = { listAddresses: vi.fn(() => addressesResponse) };
    ordersApiStub = { placeOrder: vi.fn(), createCheckout: vi.fn(), getCheckout: vi.fn(), updateCheckout: vi.fn() };
    toastStub = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CartService, useValue: cartStub },
        { provide: AccountApiService, useValue: accountApiStub },
        { provide: OrdersApiService, useValue: ordersApiStub },
        { provide: ToastService, useValue: toastStub },
      ],
    });

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    return fixture.componentInstance as unknown as Internal;
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads addresses on creation and selects the default address', () => {
    const component = createComponent(of([address({ id: 1 }), address({ id: 2, defaultAddress: true })]));
    expect(component.addresses()).toHaveLength(2);
    expect(component.selectedAddressId()).toBe(2);
    expect(component.selectedAddress()?.id).toBe(2);
  });

  it('falls back to the first address when none is marked default', () => {
    const component = createComponent(of([address({ id: 5 }), address({ id: 6 })]));
    expect(component.selectedAddressId()).toBe(5);
  });

  it('records an address error when loading addresses fails', () => {
    const component = createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));
    expect(component.addressError()).toContain('could not load your saved addresses');
  });

  it('selectAddress() overrides the computed selection', () => {
    const component = createComponent(of([address({ id: 1 }), address({ id: 2 })]));
    component.selectAddress('2');
    expect(component.selectedAddressId()).toBe(2);
    expect(component.selectedAddress()?.id).toBe(2);
  });

  it('reviewOrder() does nothing when the cart is empty', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    component.reviewOrder();
    expect(ordersApiStub.createCheckout).not.toHaveBeenCalled();
  });

  it('reviewOrder() requires a delivery address', () => {
    const component = createComponent(of([]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);

    component.reviewOrder();

    expect(component.error()).toContain('Add a delivery address');
    expect(toastStub.error).toHaveBeenCalledWith('Delivery address required.');
    expect(ordersApiStub.createCheckout).not.toHaveBeenCalled();
  });

  it('reviewOrder() sends every cart item to the persisted checkout', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([
      { productId: 1, productName: 'Widget', price: 100, quantity: 2 },
      { productId: 2, productName: 'Cable', price: 25, quantity: 3 },
    ]);
    const checkoutResponse = {
      checkoutId: 'CHK-1', version: 1, status: 'READY_TO_PLACE',
      items: [], shippingAddress: null, totalAmount: '200.00', currency: 'INR',
      expiresAt: '2026-01-01T00:00:00Z', orderId: null,
    };
    ordersApiStub.createCheckout.mockReturnValue(of(checkoutResponse));

    component.reviewOrder();

    expect(ordersApiStub.createCheckout).toHaveBeenCalledOnce();
    const [items, shippingAddress] = ordersApiStub.createCheckout.mock.calls[0];
    expect(items).toEqual([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }]);
    expect(shippingAddress).toMatchObject({ recipientName: 'Ahmed', city: 'Bengaluru' });
    expect(ordersApiStub.placeOrder).not.toHaveBeenCalled();

    expect(component.review()).toEqual(checkoutResponse);
    expect(component.loading()).toBe(false);
  });

  it('reviewOrder() ignores a second call while a request is in flight', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    const pending = new Subject<unknown>();
    ordersApiStub.createCheckout.mockReturnValue(pending.asObservable());

    component.reviewOrder();
    component.reviewOrder();

    expect(ordersApiStub.createCheckout).toHaveBeenCalledOnce();
  });

  it('confirmOrder() places every item with one checkout idempotency key and stores all receipt lines', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([
      { productId: 1, productName: 'Widget', price: 100, quantity: 2 },
      { productId: 2, productName: 'Cable', price: 25, quantity: 3 },
    ]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    ordersApiStub.placeOrder.mockReturnValue(of({ orderNumber: 'ORD-1', status: 'PENDING_INVENTORY' }));

    component.confirmOrder();

    expect(ordersApiStub.placeOrder).toHaveBeenCalledOnce();
    const [checkoutId, version, idempotencyKey] = ordersApiStub.placeOrder.mock.calls[0];
    expect(checkoutId).toBe('CHK-1');
    expect(version).toBe(1);
    expect(idempotencyKey).toMatch(/^web-/);

    expect(component.success()).toBe('ORD-1');
    expect((component.receipt() as { amount: number }).amount).toBe(275);
    expect((component.receipt() as { items: unknown[] }).items).toHaveLength(2);
    expect((component.receipt() as { paymentStatus: string }).paymentStatus).toBe('Pending capture');
    expect(cartStub.clear).toHaveBeenCalledOnce();
    expect(toastStub.success).toHaveBeenCalledWith('Order ORD-1 created.');
    expect(component.loading()).toBe(false);
  });

  it('reuses the idempotency key after an ambiguous placement failure', () => {
    const component = createComponent(of([address({ id: 3, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    component.review.set({ checkoutId: 'CHK-RETRY', version: 1 });
    ordersApiStub.placeOrder
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of({ orderNumber: 'ORD-RETRY', status: 'PENDING_INVENTORY' }));

    component.confirmOrder();
    component.confirmOrder();

    expect(ordersApiStub.placeOrder.mock.calls[0][2]).toBe(ordersApiStub.placeOrder.mock.calls[1][2]);
  });

  it('confirmOrder() maps the placed order status to a real payment-status label on the receipt', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 2 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    ordersApiStub.placeOrder.mockReturnValue(of({ orderNumber: 'ORD-1', status: 'CONFIRMED' }));

    component.confirmOrder();

    expect((component.receipt() as { paymentStatus: string }).paymentStatus).toBe('Captured');
  });

  it('confirmOrder() requires a delivery address', () => {
    const component = createComponent(of([]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });

    component.confirmOrder();

    expect(component.error()).toContain('Add a delivery address');
    expect(ordersApiStub.placeOrder).not.toHaveBeenCalled();
  });

  it('confirmOrder() on a version-mismatch 409 refreshes the checkout via getCheckout() and surfaces a distinct message', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 2 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    const refreshed = {
      checkoutId: 'CHK-1', version: 2, status: 'READY_TO_PLACE',
      items: [], shippingAddress: null, totalAmount: '200.00', currency: 'INR',
      expiresAt: '2026-01-01T00:00:00Z', orderId: null,
    };
    ordersApiStub.placeOrder.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { detail: 'The checkout has changed. Review the latest version before placing the order.' },
    })));
    ordersApiStub.getCheckout.mockReturnValue(of(refreshed));

    component.confirmOrder();

    expect(ordersApiStub.getCheckout).toHaveBeenCalledWith('CHK-1');
    expect(component.review()).toEqual(refreshed);
    expect(component.error()).toBe(APP_MESSAGES.errors.checkoutVersionMismatch);
    expect(toastStub.error).toHaveBeenCalledWith(APP_MESSAGES.errors.checkoutVersionMismatch);
    expect(component.loading()).toBe(false);
  });

  it('confirmOrder() on an expired 409 reprices via updateCheckout() and surfaces a distinct message', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 2 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    const repriced = {
      checkoutId: 'CHK-1', version: 2, status: 'READY_TO_PLACE',
      items: [], shippingAddress: null, totalAmount: '205.00', currency: 'INR',
      expiresAt: '2026-01-01T00:15:00Z', orderId: null,
    };
    ordersApiStub.placeOrder.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { detail: 'The checkout price has expired. Request a new quote before placing the order.' },
    })));
    ordersApiStub.updateCheckout.mockReturnValue(of(repriced));

    component.confirmOrder();

    expect(ordersApiStub.updateCheckout).toHaveBeenCalledWith(
      'CHK-1', [{ productId: 1, quantity: 2 }], expect.objectContaining({ recipientName: 'Ahmed' }), 1);
    expect(component.review()).toEqual(repriced);
    expect(component.error()).toBe(APP_MESSAGES.errors.checkoutExpired);
    expect(component.loading()).toBe(false);
  });

  it('reprices every cart line when the checkout has expired', () => {
    const component = createComponent(of([address({ id: 3, defaultAddress: true })]));
    cartItems.set([
      { productId: 1, productName: 'Widget', price: 100, quantity: 2 },
      { productId: 2, productName: 'Cable', price: 25, quantity: 1 },
    ]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    ordersApiStub.placeOrder.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'The checkout price has expired.' } })));
    ordersApiStub.updateCheckout.mockReturnValue(of({ checkoutId: 'CHK-1', version: 2 }));

    component.confirmOrder();

    expect(ordersApiStub.updateCheckout).toHaveBeenCalledWith(
      'CHK-1', [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }], expect.any(Object), 1);
  });

  it('confirmOrder() on an already-placed 409 clears the review and surfaces a distinct message', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 2 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    ordersApiStub.placeOrder.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { detail: 'This checkout has already been placed. Retrieve it to view its order.' },
    })));

    component.confirmOrder();

    expect(component.review()).toBeNull();
    expect(component.error()).toBe(APP_MESSAGES.errors.checkoutAlreadyPlaced);
    expect(toastStub.error).toHaveBeenCalledWith(APP_MESSAGES.errors.checkoutAlreadyPlaced);
    expect(component.loading()).toBe(false);
    expect(ordersApiStub.getCheckout).not.toHaveBeenCalled();
    expect(ordersApiStub.updateCheckout).not.toHaveBeenCalled();
  });

  it('confirmOrder() does nothing when no checkout has been reviewed yet', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);

    component.confirmOrder();

    expect(ordersApiStub.placeOrder).not.toHaveBeenCalled();
  });

  it('confirmOrder() ignores a second call while a request is in flight', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    const pending = new Subject<{ orderNumber: string }>();
    ordersApiStub.placeOrder.mockReturnValue(pending.asObservable());

    component.confirmOrder();
    component.confirmOrder();

    expect(ordersApiStub.placeOrder).toHaveBeenCalledOnce();
  });

  it.each([
    [401, APP_MESSAGES.errors.checkoutSessionExpired],
    [409, APP_MESSAGES.errors.checkoutConflict],
    [422, APP_MESSAGES.errors.checkoutInventoryUnavailable],
    [503, APP_MESSAGES.errors.checkoutServiceUnavailable],
    [418, APP_MESSAGES.errors.checkoutFailed],
  ])('maps HTTP status %s to the correct checkout error message during confirmOrder()', (status, expected) => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    component.review.set({ checkoutId: 'CHK-1', version: 1 });
    ordersApiStub.placeOrder.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

    component.confirmOrder();

    expect(component.error()).toBe(expected);
    expect(toastStub.error).toHaveBeenCalledWith(expected);
    expect(component.loading()).toBe(false);
  });

  it.each([
    [401, APP_MESSAGES.errors.checkoutSessionExpired],
    [422, APP_MESSAGES.errors.checkoutInventoryUnavailable],
  ])('maps HTTP status %s to the correct checkout error message during reviewOrder()', (status, expected) => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    ordersApiStub.createCheckout.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

    component.reviewOrder();

    expect(component.error()).toBe(expected);
    expect(toastStub.error).toHaveBeenCalledWith(expected);
    expect(component.loading()).toBe(false);
  });

  it('formatAddress() joins line1/line2 only when line2 is present', () => {
    const component = createComponent(of([]));
    expect(component.formatAddress(address({ line2: 'Apt 4' }))).toBe('1 Main St, Apt 4, Bengaluru, KA 560001, India');
    expect(component.formatAddress(address({ line2: null }))).toBe('1 Main St, Bengaluru, KA 560001, India');
  });

  it('copy() shows a success toast when the clipboard write succeeds', async () => {
    const component = createComponent(of([]));
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    await component.copy('ORD-1', 'Order number');

    expect(toastStub.success).toHaveBeenCalledWith('Order number copied.');
  });

  it('copy() shows an error toast when the clipboard write fails', async () => {
    const component = createComponent(of([]));
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });

    await component.copy('ORD-1', 'Order number');

    expect(toastStub.error).toHaveBeenCalledWith('Could not copy Order number.');
  });
});
