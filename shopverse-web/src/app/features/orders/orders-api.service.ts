import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
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
  totalAmount: number;
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

export interface CheckoutResponse {
  orderNumber: string;
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

  checkout(items: CheckoutRequestItem[], idempotencyKey: string, shippingAddress: ShippingAddress) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<CheckoutResponse>(API_PATHS.orders.checkout, { items, shippingAddress }, { headers });
  }
}
