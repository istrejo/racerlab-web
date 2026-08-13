import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { sanitizeReturnUrl } from '@core/services/auth/auth-navigation';
import { API_URL } from '@shared/utils/api-url.token';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';

const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const auth = inject(AuthService);
  const router = inject(Router);
  const isPublicAuthRequest = [
    `${apiUrl}/auth/signup`,
    `${apiUrl}/auth/login`,
    `${apiUrl}/auth/refresh`,
    `${apiUrl}/auth/logout`,
  ].includes(request.url);

  if (!request.url.startsWith(apiUrl) || isPublicAuthRequest) {
    return next(request);
  }

  const send = (
    accessToken: string,
    retried = request.context.get(AUTH_RETRIED),
  ): Observable<HttpEvent<unknown>> =>
    next(withBearerToken(request, accessToken, retried)).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          return throwError(() => error);
        }

        if (retried) {
          return handleRefreshFailure(auth, router, error);
        }

        return auth.refreshAccessToken(accessToken).pipe(
          catchError((refreshError: unknown) => handleRefreshFailure(auth, router, refreshError)),
          switchMap((refreshedToken) => send(refreshedToken, true)),
        );
      }),
    );

  const accessToken = auth.getAccessToken();
  const accessToken$ = accessToken
    ? of(accessToken)
    : auth
        .refreshAccessToken()
        .pipe(catchError((error: unknown) => handleRefreshFailure(auth, router, error)));

  return accessToken$.pipe(switchMap((token) => send(token)));
};

function withBearerToken(
  request: HttpRequest<unknown>,
  accessToken: string,
  retried: boolean,
): HttpRequest<unknown> {
  return request.clone({
    context: request.context.set(AUTH_RETRIED, retried),
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  });
}

function handleRefreshFailure(
  auth: AuthService,
  router: Router,
  error: unknown,
): Observable<never> {
  const sessionExpiryAlreadyHandled = auth.sessionExpired();
  auth.handleRefreshFailure(error);
  if (!sessionExpiryAlreadyHandled) {
    const returnUrl = sanitizeReturnUrl(router.url) ?? '/dashboard';
    void router.navigate(['/login'], { queryParams: { returnUrl } });
  }
  return throwError(() => error);
}
