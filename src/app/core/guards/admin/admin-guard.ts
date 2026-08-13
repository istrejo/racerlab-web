import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.canManageUsers() ? true : inject(Router).createUrlTree(['/dashboard']);
};
