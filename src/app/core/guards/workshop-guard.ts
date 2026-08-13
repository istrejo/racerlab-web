import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth/auth';
import { sanitizeReturnUrl } from '../services/auth/auth-navigation';

export const workshopGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveWorkshop = () => {
    if (auth.requiresPasswordChange() || auth.hasActiveWorkshop()) {
      return true;
    }

    const returnUrl = sanitizeReturnUrl(state.url);
    return router.createUrlTree(['/workshops/select'], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  };

  if (auth.hasValidAccessToken()) {
    return resolveWorkshop();
  }

  const returnUrl = sanitizeReturnUrl(state.url);
  return auth.ensureSession().pipe(
    map((result) =>
      result === 'authenticated'
        ? resolveWorkshop()
        : router.createUrlTree(['/login'], {
            queryParams: returnUrl ? { returnUrl } : undefined,
          }),
    ),
  );
};
