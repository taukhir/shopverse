import { Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { adminGuard, authGuard } from './auth.guard';
import { BrowserSession, SessionService } from './session.service';

const customer: BrowserSession = { authenticated: true, username: 'customer', roles: ['ROLE_CUSTOMER'], expiresAt: null };
const admin: BrowserSession = { authenticated: true, username: 'admin', roles: ['ROLE_ADMIN'], expiresAt: null };

describe('authGuard', () => {
  let sessionStub: { restoreSession: () => Observable<BrowserSession | null> };
  let routerStub: { createUrlTree: (...args: unknown[]) => UrlTree };
  let createUrlTreeArgs: unknown[] | null;

  beforeEach(() => {
    createUrlTreeArgs = null;
    sessionStub = { restoreSession: () => of(customer) };
    routerStub = {
      createUrlTree: (...args: unknown[]) => {
        createUrlTreeArgs = args;
        return { toString: () => '/login' } as unknown as UrlTree;
      },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  });

  it('restores and allows navigation when the server confirms a session', async () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/account' } as never));
    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toBe(true);
  });

  it('redirects to login with returnUrl when the server reports no session', async () => {
    sessionStub.restoreSession = () => of(null);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/account' } as never));
    await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(createUrlTreeArgs).toEqual([['/login'], { queryParams: { returnUrl: '/account' } }]);
  });
});

describe('adminGuard', () => {
  let sessionStub: { restoreSession: () => Observable<BrowserSession | null>; isAdmin: () => boolean };
  let routerStub: { createUrlTree: (...args: unknown[]) => UrlTree };
  let createUrlTreeArgs: unknown[] | null;

  beforeEach(() => {
    createUrlTreeArgs = null;
    sessionStub = { restoreSession: () => of(admin), isAdmin: () => true };
    routerStub = {
      createUrlTree: (...args: unknown[]) => {
        createUrlTreeArgs = args;
        return { toString: () => '/redirect' } as unknown as UrlTree;
      },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  });

  it('restores and allows navigation for an admin session', async () => {
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never));
    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toBe(true);
  });

  it('redirects to login when the server reports no session', async () => {
    sessionStub.restoreSession = () => of(null);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never));
    await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(createUrlTreeArgs).toEqual([['/login'], { queryParams: { returnUrl: '/admin' } }]);
  });

  it('redirects to unauthorized when the restored session is not an admin', async () => {
    sessionStub.restoreSession = () => of(customer);
    sessionStub.isAdmin = () => false;
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never));
    await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(createUrlTreeArgs).toEqual([['/unauthorized']]);
  });
});
