import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AdminGroupsApiService } from './admin-groups-api.service';

describe('AdminGroupsApiService', () => {
  let service: AdminGroupsApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminGroupsApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the group and membership routes from the API contract', () => {
    service.list('ops team').subscribe();
    http.expectOne('/api/v1/groups?size=100&page=0&search=ops%20team').flush({ content: [], totalElements: 0, totalPages: 0 });
    service.listMembers(9).subscribe();
    http.expectOne('/api/v1/groups/9/members?page=0&size=20').flush({ content: [], totalElements: 0, totalPages: 0 });
  });

  it('sends selected role IDs when creating a group', () => {
    const body = { groupName: 'Ops', description: 'Operations', roleIds: [1, 2] };
    service.create(body).subscribe();
    const req = http.expectOne('/api/v1/groups');
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual(body);
    req.flush({ success: true, message: 'created', data: { id: 3, ...body, memberCount: 0, roles: [] } });
  });
});
