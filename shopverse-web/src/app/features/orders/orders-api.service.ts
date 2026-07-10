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

export interface Order {
  id: number;
  orderNumber: string;
  correlationId?: string;
  idempotencyKey?: string;
  customerUsername?: string;
  status: string;
  totalAmount: number;
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

  getOrderWorkflowState(order: Order): Observable<OrderWorkflowState> {
    return forkJoin({
      timeline: this.http.get<TimelineEvent[]>(API_PATHS.orders.timeline(order.id)).pipe(catchError(() => of([]))),
      payment: order.orderNumber
        ? this.http.get<Payment>(API_PATHS.payments.byOrder(order.orderNumber)).pipe(catchError(() => of(null)))
        : of(null),
    });
  }

  checkout(items: CheckoutRequestItem[], idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<CheckoutResponse>(API_PATHS.orders.checkout, { items }, { headers });
  }
}
