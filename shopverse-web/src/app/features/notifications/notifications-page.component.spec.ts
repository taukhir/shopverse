import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { OrdersApiService, Order } from '../orders/orders-api.service';
import { NotificationsPageComponent } from './notifications-page.component';

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  orderNumber: 'ORD-1',
  status: 'CONFIRMED',
  totalAmount: '1200.00',
  createdAt: '2026-11-20T10:00:00Z',
  ...overrides,
});

describe('NotificationsPageComponent', () => {
  it('shows recent customer orders newest first and counts failed states needing attention', async () => {
    const listCustomerOrders = vi.fn(() => of([
      order({ id: 1, orderNumber: 'ORD-OLD', createdAt: '2026-11-20T10:00:00Z' }),
      order({ id: 2, orderNumber: 'ORD-NEW', status: 'PAYMENT_FAILED', createdAt: '2026-11-22T10:00:00Z' }),
    ]));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OrdersApiService, useValue: { listCustomerOrders } },
      ],
    });

    const fixture = TestBed.createComponent(NotificationsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(listCustomerOrders).toHaveBeenCalledTimes(1);
    expect(text.indexOf('ORD-NEW')).toBeLessThan(text.indexOf('ORD-OLD'));
    expect(text).toContain('Payment Failed');
    expect(text).toContain('1');
  });

  it('shows an empty state when the customer has no orders', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: OrdersApiService, useValue: { listCustomerOrders: () => of([]) } }],
    });

    const fixture = TestBed.createComponent(NotificationsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your order activity will appear here.');
  });

  it('offers retry after order activity fails to load', async () => {
    const listCustomerOrders = vi.fn().mockReturnValueOnce(throwError(() => new Error('unavailable'))).mockReturnValueOnce(of([order()]));
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: OrdersApiService, useValue: { listCustomerOrders } }],
    });

    const fixture = TestBed.createComponent(NotificationsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const retry = (fixture.nativeElement as HTMLElement).querySelector('app-service-notice button') as HTMLButtonElement | null;
    expect(retry).not.toBeNull();
    retry?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listCustomerOrders).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ORD-1');
  });
});
