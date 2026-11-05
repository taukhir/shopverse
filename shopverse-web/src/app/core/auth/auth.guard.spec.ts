import { Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { adminGuard, authGuard } from './auth.guard';
import { SessionService } from './session.service';

describe('authGuard', () => {
  let sessionStub: { isAuthenticated: () => boolean; isAdmin: () => boolean };
  let routerStub: { createUrlTree: (...args: unknown[]) => UrlTree };
  let createUrlTreeArgs: unknown[] | null;

  beforeEach(() => {
    createUrlTreeArgs = null;
    sessionStub = { isAuthenticated: () => false, isAdmin: () => false };
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

  it('allows navigation when authenticated', () => {
    sessionStub.isAuthenticated = () => true;
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/account' } as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/account' } as never),
    );
    expect(result).not.toBe(true);
    expect(createUrlTreeArgs).toEqual([['/login'], { queryParams: { returnUrl: '/account' } }]);
  });
});

describe('adminGuard', () => {
  let sessionStub: { isAuthenticated: () => boolean; isAdmin: () => boolean };
  let routerStub: { createUrlTree: (...args: unknown[]) => UrlTree };
  let createUrlTreeArgs: unknown[] | null;

  beforeEach(() => {
    createUrlTreeArgs = null;
    sessionStub = { isAuthenticated: () => false, isAdmin: () => false };
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

  it('allows navigation for an authenticated admin', () => {
    sessionStub.isAuthenticated = () => true;
    sessionStub.isAdmin = () => true;
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to /login when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );
    expect(result).not.toBe(true);
    expect(createUrlTreeArgs).toEqual([['/login'], { queryParams: { returnUrl: '/admin' } }]);
  });

  it('redirects to /unauthorized when authenticated but not an admin', () => {
    sessionStub.isAuthenticated = () => true;
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );
    expect(result).not.toBe(true);
    expect(createUrlTreeArgs).toEqual([['/unauthorized']]);
  });
});
