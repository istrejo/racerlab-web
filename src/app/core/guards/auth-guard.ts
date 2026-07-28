import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.getAccessToken()?.trim()) {
    if (auth.requiresPasswordChange()) {
      return inject(Router).createUrlTree(['/change-password']);
    }
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
