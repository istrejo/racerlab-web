import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination } from '@core/services/auth/auth-navigation';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasValidAccessToken()) {
    return resolveAuthenticatedNavigation(auth, router, state);
  }

  return auth
    .ensureSession()
    .pipe(
      map((result) =>
        result === 'authenticated'
          ? resolveAuthenticatedNavigation(auth, router, state)
          : resolveFailedRestoration(router, state.url),
      ),
    );
};

function resolveAuthenticatedNavigation(
  auth: AuthService,
  router: Router,
  state: RouterStateSnapshot,
): true | ReturnType<Router['createUrlTree']> {
  const targetPath = state.url.split(/[?#]/, 1)[0];
  if (auth.requiresPasswordChange() && targetPath !== '/change-password') {
    return router.parseUrl(authenticatedDestination(auth, state.url));
  }

  return true;
}

function resolveFailedRestoration(
  router: Router,
  returnUrl: string,
): ReturnType<Router['createUrlTree']> {
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl },
  });
}
