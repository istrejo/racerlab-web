import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination } from '@core/services/auth/auth-navigation';

export const guestGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const redirectAuthenticatedSession = () =>
    router.parseUrl(authenticatedDestination(auth, route.queryParamMap.get('returnUrl')));

  if (auth.hasValidAccessToken()) {
    return redirectAuthenticatedSession();
  }

  return auth
    .probeSession()
    .pipe(map((result) => (result === 'authenticated' ? redirectAuthenticatedSession() : true)));
};
