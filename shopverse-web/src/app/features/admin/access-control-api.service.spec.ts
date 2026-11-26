import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AccessControlApiService } from './access-control-api.service';

describe('AccessControlApiService', () => {
  let service: AccessControlApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AccessControlApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads role and permission pages from their configured APIs', () => {
    service.listRoles().subscribe();
    http.expectOne('/api/v1/roles?size=100&page=0').flush({ content: [], totalElements: 0, totalPages: 1 });
    service.listPermissions().subscribe();
    http.expectOne('/api/v1/permissions?size=100&page=0').flush({ content: [], totalElements: 0, totalPages: 1 });
  });

  it('sends role permission names when creating a role', () => {
    const body = { roleName: 'ROLE_SUPPORT', description: 'Support', permissions: ['ORDER_READ'] };
    service.createRole(body).subscribe();
    const req = http.expectOne('/api/v1/roles');
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual(body);
    req.flush({ success: true, message: 'created', data: { id: 4, ...body, permissions: [] } });
  });
});
