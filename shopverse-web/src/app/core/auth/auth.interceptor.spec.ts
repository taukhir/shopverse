import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { NetworkStatusService } from '../network/network-status.service';
import { SessionService } from './session.service';

describe('authInterceptor', () => {
  let sessionStub: { token: () => string | null; logout: () => void };
  let networkStub: { requestStarted: () => void; requestSucceeded: () => void; requestFailed: (status: number) => void; requestSlow: () => void };
  let routerStub: { url: string; navigate: (...args: unknown[]) => void };
  let logoutCalled: boolean;
  let navigateArgs: unknown[] | null;

  function setup(): void {
    logoutCalled = false;
    navigateArgs = null;
    sessionStub = { token: () => 'token-123', logout: () => { logoutCalled = true; } };
    networkStub = {
      requestStarted: vi.fn(),
      requestSucceeded: vi.fn(),
      requestFailed: vi.fn(),
      requestSlow: vi.fn(),
    };
    routerStub = { url: '/account', navigate: (...args: unknown[]) => { navigateArgs = args; } };
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionStub },
        { provide: NetworkStatusService, useValue: networkStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    setup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function run(url: string, next: HttpHandlerFn) {
    const request = new HttpRequest('GET', url);
    return TestBed.runInInjectionContext(() => authInterceptor(request, next));
  }

  it('attaches a correlation id and bearer token for a private request', async () => {
    let authorization = '';
    let correlation = '';
    const next: HttpHandlerFn = (req) => {
      authorization = req.headers.get('Authorization') ?? '';
      correlation = req.headers.get('X-Correlation-Id') ?? '';
      return of(new HttpResponse({ status: 200 }));
    };

    await run('/api/v1/orders', next).toPromise();

    expect(authorization).toBe('Bearer token-123');
    expect(correlation.length).toBeGreaterThan(0);
  });

  it('does not attach a bearer token for a public API', async () => {
    let authHeader: string | null = 'unset';
    const next: HttpHandlerFn = (req) => {
      authHeader = req.headers.get('Authorization');
      return of(new HttpResponse({ status: 200 }));
    };

    await run('/auth/login', next).toPromise();

    expect(authHeader).toBeNull();
  });

  it('reports request start and success to NetworkStatusService', async () => {
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200 }));
    await run('/api/v1/orders', next).toPromise();

    expect(networkStub.requestStarted).toHaveBeenCalledOnce();
    expect(networkStub.requestSucceeded).toHaveBeenCalledOnce();
  });

  it('reports a slow request once the slow threshold elapses', () => {
    const pending = new Subject<HttpResponse<unknown>>();
    const next: HttpHandlerFn = () => pending.asObservable();
    const result$ = run('/api/v1/orders', next);
    const sub = result$.subscribe();

    vi.advanceTimersByTime(3500);
    expect(networkStub.requestSlow).toHaveBeenCalledOnce();

    pending.next(new HttpResponse({ status: 200 }));
    pending.complete();
    sub.unsubscribe();
  });

  it('on a 401 for a private request, logs out and redirects to /login with returnUrl', async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(run('/api/v1/orders', next).toPromise()).rejects.toBe(error);

    expect(logoutCalled).toBe(true);
    expect(navigateArgs).toEqual([['/login'], { queryParams: { returnUrl: '/account', expired: 'true' } }]);
  });

  it('on a 401 while already on /login, does not navigate again', async () => {
    routerStub.url = '/login';
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(run('/api/v1/orders', next).toPromise()).rejects.toBe(error);

    expect(logoutCalled).toBe(true);
    expect(navigateArgs).toBeNull();
  });

  it('on a 401 for a public request, does not log out', async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(run('/auth/login', next).toPromise()).rejects.toBe(error);

    expect(logoutCalled).toBe(false);
    expect(navigateArgs).toBeNull();
  });

  it('reports non-401 failures to NetworkStatusService without logging out', async () => {
    const error = new HttpErrorResponse({ status: 503 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(run('/api/v1/orders', next).toPromise()).rejects.toBe(error);

    expect(networkStub.requestFailed).toHaveBeenCalledWith(503);
    expect(logoutCalled).toBe(false);
  });
});
