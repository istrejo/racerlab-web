import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const workshopGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.hasActiveWorkshop() ? true : inject(Router).createUrlTree(['/workshops/select']);
};
