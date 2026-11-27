import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { API_PATHS } from '../../core/api/api-paths';
import { AdminApiService, AdminOverviewData } from './admin-api.service';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the requested server page for admin users', () => {
    service.loadUsers(2, 8, 'john doe').subscribe((page) => {
      expect(page.totalElements).toBe(43);
      expect(page.content).toHaveLength(8);
    });

    const request = http.expectOne('/api/v1/admin/users?page=2&size=8&search=john%20doe');
    expect(request.request.method).toBe('GET');
    request.flush({ content: Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })), totalElements: 43 });
  });

  it('requests bounded admin orders with search, status, and sort filters', () => {
    service.loadAdminOrders(2, 8, 'ORD-123', 'PAYMENT_FAILED', 'totalAmount', 'ASC').subscribe((page) => {
      expect(page.totalElements).toBe(1);
      expect(page.content[0].orderNumber).toBe('ORD-123');
    });

    const request = http.expectOne('/api/v1/orders/admin?page=2&size=8&sortBy=totalAmount&direction=ASC&search=ORD-123&status=PAYMENT_FAILED');
    expect(request.request.method).toBe('GET');
    request.flush({ content: [{ id: 1, orderNumber: 'ORD-123' }], totalElements: 1 });
  });

  it('requests paged and filtered durable activity from the audit API', () => {
    service.loadAuditEvents(1, 12, 'ORDERS', 'admin@shopverse.com', 'FAILED', 'timeout order').subscribe((page) => {
      expect(page.totalElements).toBe(19);
      expect(page.content).toEqual([]);
    });

    const request = http.expectOne('/api/v1/admin/audit-events?page=1&size=12&area=ORDERS&actor=admin%40shopverse.com&result=FAILED&search=timeout%20order');
    expect(request.request.method).toBe('GET');
    request.flush({ content: [], totalElements: 19, totalPages: 2, number: 1, size: 12 });
  });

  it('keeps optional source failures distinguishable from successful empty results', () => {
    let result: AdminOverviewData | undefined;
    service.loadOverview().subscribe((overview) => { result = overview; });

    http.expectOne(API_PATHS.orders.adminAll).flush([]);
    http.expectOne(API_PATHS.adminUsers.page(0, 12)).flush({ content: [], totalElements: 0 });
    http.expectOne(API_PATHS.inventory.publicItems).flush([]);
    http.expectOne(API_PATHS.payments.admin).error(new ProgressEvent('error'));
    http.expectOne(API_PATHS.orders.deadLetters).flush([]);
    http.expectOne(API_PATHS.inventory.deadLetters).flush([]);
    http.expectOne(API_PATHS.payments.deadLetters).flush([]);

    expect(result?.inventory).toEqual({ data: [], available: true });
    expect(result?.payments).toEqual({ data: [], available: false });
    expect(result?.orderDeadLetters).toEqual({ data: [], available: true });
  });
});
