import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

export const customerReadGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.canReadCustomers() ? true : inject(Router).createUrlTree(['/dashboard']);
};
