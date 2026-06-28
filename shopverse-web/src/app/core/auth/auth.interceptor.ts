import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const isPublic = request.url.startsWith('/auth/') || request.url.includes('/public/');
  const token = session.token();
  const headers: Record<string, string> = { 'X-Correlation-Id': crypto.randomUUID() };
  if (token && !isPublic) headers['Authorization'] = `Bearer ${token}`;
  return next(request.clone({ setHeaders: headers }));
};
