import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, tap, throwError } from 'rxjs';

import { PUBLIC_API_MARKERS } from '../api/api-paths';
import { NetworkStatusService } from '../network/network-status.service';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const network = inject(NetworkStatusService);
  const router = inject(Router);
  const isPublic = PUBLIC_API_MARKERS.some((marker) => request.url.includes(marker));
  const token = session.token();
  const headers: Record<string, string> = { 'X-Correlation-Id': crypto.randomUUID() };
  if (token && !isPublic) headers['Authorization'] = `Bearer ${token}`;
  network.requestStarted();
  const slowTimer = setTimeout(() => network.requestSlow(), 3500);

  return next(request.clone({ setHeaders: headers })).pipe(
    tap(() => network.requestSucceeded()),
    catchError((error: unknown) => {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      network.requestFailed(status);
      if (status === 401 && !isPublic) {
        session.logout();
        const currentUrl = router.url || '/';
        if (!currentUrl.startsWith('/login')) {
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl, expired: 'true' } });
        }
      }
      return throwError(() => error);
    }),
    finalize(() => clearTimeout(slowTimer)),
  );
};
