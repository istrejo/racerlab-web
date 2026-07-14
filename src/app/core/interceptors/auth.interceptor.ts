import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../../shared/utils/api-url.token';
import { AuthService } from '@core/services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const accessToken = inject(AuthService).getAccessToken();
  const isAuthRequest = request.url.startsWith(`${apiUrl}/auth/`);

  if (!accessToken?.trim() || !request.url.startsWith(apiUrl) || isAuthRequest) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    }),
  );
};
