import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SessionService, BrowserSession } from './session.service';

const customerSession: BrowserSession = {
  authenticated: true,
  username: 'bob',
  roles: ['ROLE_CUSTOMER'],
  expiresAt: '2026-11-25T12:00:00Z',
};

describe('SessionService', () => {
  let httpMock: HttpTestingController;

  function create(): SessionService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(SessionService);
  }

  afterEach(() => httpMock?.verify());

  it('starts without an in-memory session and does not read browser storage', () => {
    sessionStorage.setItem('shopverse.session.token', 'legacy-token');
    const service = create();
    expect(service.identity()).toBeNull();
    expect(service.username()).toBeNull();
    expect(service.roles()).toEqual([]);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(sessionStorage.getItem('shopverse.session.token')).toBeNull();
  });

  it('login obtains CSRF protection, authenticates, then loads the server-backed session', () => {
    const service = create();
    let result: BrowserSession | null | undefined;
    service.login('bob', 'secret').subscribe((session) => { result = session; });

    httpMock.expectOne('/auth/csrf').flush(null);
    const login = httpMock.expectOne('/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ username: 'bob', password: 'secret' });
    login.flush({ authenticated: true });
    httpMock.expectOne('/auth/session').flush(customerSession);

    expect(result).toEqual(customerSession);
    expect(service.username()).toBe('bob');
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem('shopverse.session.token')).toBeNull();
  });

  it('restores the HttpOnly-cookie session from the server and shares an in-flight request', () => {
    const service = create();
    let first: BrowserSession | null | undefined;
    let second: BrowserSession | null | undefined;
    service.restoreSession().subscribe((session) => { first = session; });
    service.restoreSession().subscribe((session) => { second = session; });

    httpMock.expectOne('/auth/session').flush(customerSession);

    expect(first).toEqual(customerSession);
    expect(second).toEqual(customerSession);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('uses roles returned by the server to control admin-only navigation visibility', () => {
    const service = create();
    service.restoreSession().subscribe();
    httpMock.expectOne('/auth/session').flush({ ...customerSession, username: 'admin', roles: ['ROLE_ADMIN'] });
    expect(service.isAdmin()).toBe(true);
    expect(service.canAccessBackOffice()).toBe(true);
  });

  it('loads and caches the current account profile', () => {
    const service = create();
    service.loadProfile().subscribe();
    const request = httpMock.expectOne('/api/v1/accounts/current');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 1, username: 'bob', email: 'bob@example.test', firstName: 'Bob', lastName: 'B',
      phoneNumber: null, status: 'ACTIVE', roles: [],
    });
    expect(service.profile()?.username).toBe('bob');
  });

  it('updateProfile() patches and stores the changed profile', () => {
    const service = create();
    service.updateProfile({ email: 'new@example.test', firstName: 'Bob', lastName: 'B', phoneNumber: '123' }).subscribe();
    const request = httpMock.expectOne('/api/v1/accounts/current');
    expect(request.request.method).toBe('PATCH');
    request.flush({
      id: 1, username: 'bob', email: 'new@example.test', firstName: 'Bob', lastName: 'B',
      phoneNumber: '123', status: 'ACTIVE', roles: [],
    });
    expect(service.profile()?.email).toBe('new@example.test');
  });

  it('logout clears in-memory identity and profile without storing or exposing a token', () => {
    const service = create();
    service.restoreSession().subscribe();
    httpMock.expectOne('/auth/session').flush(customerSession);
    service.logout();
    expect(service.identity()).toBeNull();
    expect(service.profile()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logoutFromServer sends the cookie-authenticated logout request and clears session only after success', () => {
    const service = create();
    service.restoreSession().subscribe();
    httpMock.expectOne('/auth/session').flush(customerSession);
    let completed = false;
    service.logoutFromServer().subscribe(() => { completed = true; });

    const request = httpMock.expectOne('/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(service.isAuthenticated()).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
    expect(service.identity()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
