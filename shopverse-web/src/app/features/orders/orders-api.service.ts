import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface ShippingAddress {
  recipientName: string;
  phoneNumber?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  correlationId?: string;
  idempotencyKey?: string;
  customerUsername?: string;
  status: string;
  totalAmount: string;
  shippingAddress?: ShippingAddress | null;
  items?: OrderItem[];
  createdAt: string;
}

export interface TimelineEvent {
  orderNumber: string;
  correlationId: string;
  stage: string;
  detail: string;
  occurredAt: string;
}

export interface Payment {
  id: number;
  orderNumber: string;
  correlationId: string;
  amount: number;
  status: string;
  paymentReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequestItem {
  productId: number;
  quantity: number;
}

export interface Checkout {
  checkoutId: string;
  version: number;
  status: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
  currency: string;
  totalAmount: string;
  expiresAt: string;
  orderId: number | null;
}

export interface OrderWorkflowState {
  timeline: TimelineEvent[];
  payment: Payment | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);

  listCustomerOrders() {
    return this.http.get<Order[]>(API_PATHS.orders.customer);
  }

  getOrder(id: number | string) {
    return this.http.get<Order>(API_PATHS.orders.byId(id));
  }

  cancelOrder(id: number | string) {
    return this.http.post<Order>(API_PATHS.orders.cancel(id), {});
  }

  requestReturn(id: number | string) {
    return this.http.post<Order>(API_PATHS.orders.returnRequest(id), {});
  }

  retryPayment(orderNumber: string) {
    return this.http.post<Payment>(API_PATHS.payments.retry(orderNumber), {});
  }

  requestRefund(orderNumber: string) {
    return this.http.post<Payment>(API_PATHS.payments.refund(orderNumber), {});
  }

  getOrderWorkflowState(order: Order): Observable<OrderWorkflowState> {
    return forkJoin({
      timeline: this.http.get<TimelineEvent[]>(API_PATHS.orders.timeline(order.id)).pipe(catchError(() => of([]))),
      payment: order.orderNumber
        ? this.http.get<Payment>(API_PATHS.payments.byOrder(order.orderNumber)).pipe(catchError(() => of(null)))
        : of(null),
    });
  }

  createCheckout(items: CheckoutRequestItem[], shippingAddress: ShippingAddress) {
    return this.http.post<Checkout>(API_PATHS.checkouts.root, { items, shippingAddress });
  }

  getCheckout(checkoutId: string) {
    return this.http.get<Checkout>(API_PATHS.checkouts.byId(checkoutId));
  }

  updateCheckout(checkoutId: string, items: CheckoutRequestItem[], shippingAddress: ShippingAddress, checkoutVersion: number) {
    return this.http.put<Checkout>(API_PATHS.checkouts.byId(checkoutId), { checkoutVersion, items, shippingAddress });
  }

  placeOrder(checkoutId: string, checkoutVersion: number, idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<Order>(API_PATHS.checkouts.placeOrder(checkoutId), { checkoutVersion }, { headers });
  }
}
