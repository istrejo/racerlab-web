import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const customerWriteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.canWriteCustomers() ? true : inject(Router).createUrlTree(['/customers']);
};
