import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '../constants/storage-keys';
import { SessionService } from './session.service';

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_');
}

function buildToken(claims: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'RS256' }));
  const payload = toBase64Url(JSON.stringify(claims));
  return `${header}.${payload}.signature`;
}

describe('SessionService', () => {
  let httpMock: HttpTestingController;

  function create(): SessionService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(SessionService);
  }

  afterEach(() => {
    httpMock?.verify();
    sessionStorage.clear();
  });

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated when there is no stored token', () => {
    const service = create();
    expect(service.token()).toBeNull();
    expect(service.username()).toBeNull();
    expect(service.roles()).toEqual([]);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdmin()).toBe(false);
  });

  it('reads a previously stored, valid token on construction', () => {
    const token = buildToken({ sub: 'alice', roles: 'ROLE_CUSTOMER', exp: Math.floor(Date.now() / 1000) + 3600 });
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, token);
    const service = create();
    expect(service.username()).toBe('alice');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('login() stores the token and updates signals', () => {
    const service = create();
    const token = buildToken({ sub: 'bob', roles: 'ROLE_CUSTOMER', exp: Math.floor(Date.now() / 1000) + 3600 });

    service.login('bob', 'secret').subscribe();
    const request = httpMock.expectOne('/auth/login');
    expect(request.request.body).toEqual({ username: 'bob', password: 'secret' });
    request.flush({ token });

    expect(service.token()).toBe(token);
    expect(service.username()).toBe('bob');
    expect(sessionStorage.getItem(STORAGE_KEYS.sessionToken)).toBe(token);
  });

  it('parses roles from a space-separated roles claim and detects admin', () => {
    const token = buildToken({ sub: 'admin1', roles: 'ROLE_CUSTOMER ROLE_ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 });
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, token);
    const service = create();
    expect(service.roles()).toEqual(['ROLE_CUSTOMER', 'ROLE_ADMIN']);
    expect(service.isAdmin()).toBe(true);
  });

  it('treats an expired token as unauthenticated', () => {
    const token = buildToken({ sub: 'carol', roles: 'ROLE_CUSTOMER', exp: Math.floor(Date.now() / 1000) - 10 });
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, token);
    const service = create();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('treats a malformed token as no claims instead of throwing', () => {
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, 'not-a-jwt');
    const service = create();
    expect(() => service.username()).not.toThrow();
    expect(service.username()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('loadProfile() fetches and stores the profile', () => {
    const service = create();
    service.loadProfile().subscribe();
    httpMock.expectOne('/api/v1/users/me').flush({
      id: 1, username: 'bob', email: 'bob@example.test', firstName: 'Bob', lastName: 'B',
      phoneNumber: null, status: 'ACTIVE', roles: [],
    });
    expect(service.profile()?.username).toBe('bob');
  });

  it('updateProfile() puts and replaces the stored profile', () => {
    const service = create();
    service.updateProfile({ email: 'new@example.test', firstName: 'Bob', lastName: 'B', phoneNumber: '123' }).subscribe();
    httpMock.expectOne('/api/v1/users/me').flush({
      id: 1, username: 'bob', email: 'new@example.test', firstName: 'Bob', lastName: 'B',
      phoneNumber: '123', status: 'ACTIVE', roles: [],
    });
    expect(service.profile()?.email).toBe('new@example.test');
  });

  it('logout() clears the token and profile', () => {
    const token = buildToken({ sub: 'dana', roles: 'ROLE_CUSTOMER', exp: Math.floor(Date.now() / 1000) + 3600 });
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, token);
    const service = create();
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.profile()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.sessionToken)).toBeNull();
  });
});
