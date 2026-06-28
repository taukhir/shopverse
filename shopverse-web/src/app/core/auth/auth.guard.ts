import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService);
  return session.isAuthenticated() || inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const adminGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService);
  if (!session.isAuthenticated()) return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return session.isAdmin() || inject(Router).createUrlTree(['/account']);
};
