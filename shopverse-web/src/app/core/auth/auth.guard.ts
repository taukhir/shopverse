import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.restoreSession().pipe(map((identity) => identity
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })));
};

export const adminGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.restoreSession().pipe(map((identity) => {
    if (!identity) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    return session.isAdmin() || router.createUrlTree(['/unauthorized']);
  }));
};
