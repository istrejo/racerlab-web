import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const passwordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getAccessToken()?.trim()) {
    return router.createUrlTree(['/login']);
  }

  return auth.requiresPasswordChange() ? true : router.createUrlTree(['/dashboard']);
};
