import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

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
  inventory: AdminSource<AdminInventoryItem[]>;
  payments: AdminSource<AdminPayment[]>;
  orderDeadLetters: AdminSource<AdminFailedEvent[]>;
  inventoryDeadLetters: AdminSource<AdminFailedEvent[]>;
  paymentDeadLetters: AdminSource<AdminFailedEvent[]>;
}

export interface AdminSource<T> {
  data: T;
  available: boolean;
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

  loadOrders() {
    return this.http.get<AdminOrder[]>(API_PATHS.orders.adminAll);
  }

  loadAdminOrders(page = 0, size = 20, search = '', status = 'ALL', sortBy = 'createdAt', direction: 'ASC' | 'DESC' = 'DESC') {
    return this.http.get<Page<AdminOrder>>(API_PATHS.orders.adminPage(page, size, search, status, sortBy, direction));
  }

  loadUsers(page = 0, size = 12, search = '') {
    return this.http.get<Page<AdminUser>>(API_PATHS.adminUsers.page(page, size, search));
  }

  loadOverview() {
    return forkJoin({
      orders: this.loadOrders(),
      users: this.loadUsers(),
      inventory: this.optionalSource(this.http.get<AdminInventoryItem[]>(API_PATHS.inventory.publicItems)),
      payments: this.optionalSource(this.http.get<AdminPayment[]>(API_PATHS.payments.admin)),
      orderDeadLetters: this.optionalSource(this.http.get<AdminFailedEvent[]>(API_PATHS.orders.deadLetters)),
      inventoryDeadLetters: this.optionalSource(this.http.get<AdminFailedEvent[]>(API_PATHS.inventory.deadLetters)),
      paymentDeadLetters: this.optionalSource(this.http.get<AdminFailedEvent[]>(API_PATHS.payments.deadLetters)),
    });
  }

  loadActivitySources() {
    return forkJoin({
      orders: this.loadOrders(),
      inventory: this.http.get<AdminInventoryItem[]>(API_PATHS.inventory.publicItems).pipe(catchError(() => of([] as AdminInventoryItem[]))),
      payments: this.http.get<AdminPayment[]>(API_PATHS.payments.admin).pipe(catchError(() => of([] as AdminPayment[]))),
      orderDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.orders.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
      inventoryDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.inventory.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
      paymentDeadLetters: this.http.get<AdminFailedEvent[]>(API_PATHS.payments.deadLetters).pipe(catchError(() => of([] as AdminFailedEvent[]))),
    });
  }

  loadAuditEvents(page = 0, size = 20, area = '', actor = '', result = '', search = '') {
    return this.http.get<Page<AdminAuditEvent>>(API_PATHS.admin.auditEvents(page, size, area, actor, result, search));
  }

  private optionalSource<T>(request: Observable<T>, fallback: T = [] as T) {
    return request.pipe(
      map((data) => ({ data, available: true })),
      catchError(() => of({ data: fallback, available: false })),
    );
  }
}
