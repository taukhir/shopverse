import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { SessionService } from '../../core/auth/session.service';
import { AccountApiService, UserAddressRequest } from './account-api.service';

describe('AccountApiService', () => {
  let service: AccountApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(),
        { provide: SessionService, useValue: { sessionVersion: () => 0 } }],
    });
    service = TestBed.inject(AccountApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('forwards an explicit false defaultAddress value unchanged', () => {
    const request: UserAddressRequest = { label: 'Office', recipientName: 'A', line1: '1 Road', line2: '', city: 'Bengaluru', state: 'KA', postalCode: '560001', country: 'IN', phoneNumber: '', defaultAddress: false };
    service.updateAddress(7, request).subscribe();
    const req = http.expectOne('/api/v1/accounts/current/addresses/7');
    expect(req.request.body.defaultAddress).toBe(false);
    req.flush({ id: 7, ...request });
  });

  it('can invalidate a cached address list and read the canonical server list again', () => {
    let first: unknown;
    service.listAddresses().subscribe((items) => first = items);
    http.expectOne('/api/v1/accounts/current/addresses').flush([]);
    expect(first).toEqual([]);
    service.listAddresses().subscribe();
    http.expectNone('/api/v1/accounts/current/addresses');
    service.invalidateAddresses();
    service.listAddresses(true).subscribe();
    http.expectOne('/api/v1/accounts/current/addresses').flush([]);
  });
});
