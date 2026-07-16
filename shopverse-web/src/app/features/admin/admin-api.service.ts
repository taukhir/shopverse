import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export interface AdminOrder {
  id: number;
  orderNumber: string;
  customerUsername: string;
  status: string;
  totalAmount: number;
  createdAt?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

export interface AdminInventoryItem {
  productId: number;
  productName: string;
  category: string;
  availableQuantity: number;
  reservedQuantity: number;
  available: boolean;
  unitPrice: number;
  updatedAt?: string;
}

export interface AdminPayment {
  id: number;
  orderNumber: string;
  amount: number;
  status: string;
  failureReason: string | null;
  updatedAt: string;
}

export interface AdminFailedEvent {
  id: number;
  sourceTopic: string;
  failureReason: string;
  retryCount: number;
  replayed: boolean;
  replayCount: number;
  failedAt: string;
  replayedAt: string | null;
  service?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
}

export interface AdminOverviewData {
  orders: AdminOrder[];
  users: Page<AdminUser>;
  inventory: AdminInventoryItem[];
  payments: AdminPayment[];
  failedEvents: AdminFailedEvent[];
}

export interface AdminAuditEvent {
  id: number | string;
  area: string;
  action?: string;
  title?: string;
  actor: string;
  result: string;
  status?: string;
  message?: string;
  description?: string;
  occurredAt: string;
  subjectType?: string;
  subjectId?: number | string;
  link?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  loadOverview() {
    return forkJoin({
      orders: this.http.get<AdminOrder[]>(API_PATHS.orders.adminAll),
      users: this.http.get<Page<AdminUser>>(API_PATHS.users.page(12)),
      inventory: this.http.get<AdminInventoryItem[]>(API_PATHS.inventory.publicItems).pipe(catchError(() => of([] as AdminInventoryItem[]))),
      payments: this.http.get<AdminPayment[]>(API_PATHS.payments.admin).pipe(catchError(() => of([] as AdminPayment[]))),
      orderDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.orders.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
      inventoryDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.inventory.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
      paymentDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.payments.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
    });
  }

  loadAuditEvents() {
    return this.http.get<Page<AdminAuditEvent>>(API_PATHS.admin.auditEvents).pipe(map((page) => page.content ?? []));
  }
}
