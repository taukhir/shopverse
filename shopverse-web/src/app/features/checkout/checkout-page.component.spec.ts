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
  addresses: ReturnType<typeof signal<UserAddress[]>>;
  selectedAddressId: ReturnType<typeof signal<number | null>>;
  selectedAddress: () => UserAddress | null;
  placeOrder(): void;
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
  let ordersApiStub: { checkout: ReturnType<typeof vi.fn> };
  let toastStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function createComponent(addressesResponse = of<UserAddress[]>([])): Internal {
    cartItems = signal<CartItem[]>([]);
    cartStub = { items: () => cartItems(), clear: vi.fn(() => cartItems.set([])) };
    accountApiStub = { listAddresses: vi.fn(() => addressesResponse) };
    ordersApiStub = { checkout: vi.fn() };
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

  it('placeOrder() does nothing when the cart is empty', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    component.placeOrder();
    expect(ordersApiStub.checkout).not.toHaveBeenCalled();
  });

  it('placeOrder() requires a delivery address', () => {
    const component = createComponent(of([]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);

    component.placeOrder();

    expect(component.error()).toContain('Add a delivery address');
    expect(toastStub.error).toHaveBeenCalledWith('Delivery address required.');
    expect(ordersApiStub.checkout).not.toHaveBeenCalled();
  });

  it('placeOrder() checks out the first cart item, clears the cart, and stores a receipt on success', () => {
    const chosenAddress = address({ id: 3, defaultAddress: true });
    const component = createComponent(of([chosenAddress]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 2 }]);
    ordersApiStub.checkout.mockReturnValue(of({ orderNumber: 'ORD-1' }));

    component.placeOrder();

    expect(ordersApiStub.checkout).toHaveBeenCalledOnce();
    const [items, idempotencyKey, shippingAddress] = ordersApiStub.checkout.mock.calls[0];
    expect(items).toEqual([{ productId: 1, quantity: 2 }]);
    expect(idempotencyKey).toMatch(/^web-1-/);
    expect(shippingAddress).toMatchObject({ recipientName: 'Ahmed', city: 'Bengaluru' });

    expect(component.success()).toBe('ORD-1');
    expect((component.receipt() as { amount: number }).amount).toBe(200);
    expect(cartStub.clear).toHaveBeenCalledOnce();
    expect(toastStub.success).toHaveBeenCalledWith('Order ORD-1 created.');
    expect(component.loading()).toBe(false);
  });

  it('placeOrder() ignores a second call while a request is in flight', () => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    const pending = new Subject<{ orderNumber: string }>();
    ordersApiStub.checkout.mockReturnValue(pending.asObservable());

    component.placeOrder();
    component.placeOrder();

    expect(ordersApiStub.checkout).toHaveBeenCalledOnce();
  });

  it.each([
    [401, APP_MESSAGES.errors.checkoutSessionExpired],
    [409, APP_MESSAGES.errors.checkoutConflict],
    [422, APP_MESSAGES.errors.checkoutInventoryUnavailable],
    [503, APP_MESSAGES.errors.checkoutServiceUnavailable],
    [418, APP_MESSAGES.errors.checkoutFailed],
  ])('maps HTTP status %s to the correct checkout error message', (status, expected) => {
    const component = createComponent(of([address({ id: 1, defaultAddress: true })]));
    cartItems.set([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    ordersApiStub.checkout.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

    component.placeOrder();

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
