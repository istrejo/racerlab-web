import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_URL } from '../../shared/utils/api-url.token';
import { AuthRefreshError, AuthService } from '@core/services/auth/auth';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let accessToken: string | null;
  let sessionExpired: boolean;
  const refreshAccessToken = vi.fn();
  const handleRefreshFailure = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));

  beforeEach(() => {
    accessToken = 'access-token';
    sessionExpired = false;
    refreshAccessToken.mockReset();
    refreshAccessToken.mockReturnValue(of('refreshed-token'));
    handleRefreshFailure.mockReset();
    handleRefreshFailure.mockReturnValue('invalid');
    navigate.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => accessToken,
            refreshAccessToken,
            handleRefreshFailure,
            sessionExpired: () => sessionExpired,
          },
        },
        { provide: Router, useValue: { url: '/customers', navigate } },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds the current bearer token to protected API requests', () => {
    TestBed.inject(HttpClient).get('https://api.racerlab.test/api/customers').subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/customers');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    request.flush([]);
  });

  it.each(['refresh', 'login', 'signup', 'logout'])(
    'does not attach a bearer token or refresh recursively for auth/%s',
    (endpoint) => {
      TestBed.inject(HttpClient)
        .post(`https://api.racerlab.test/api/auth/${endpoint}`, {})
        .subscribe();

      const request = http.expectOne(`https://api.racerlab.test/api/auth/${endpoint}`);
      expect(request.request.headers.has('Authorization')).toBe(false);
      expect(refreshAccessToken).not.toHaveBeenCalled();
      request.flush({});
    },
  );

  it('uses the refresh cookie when a protected request has no in-memory token', () => {
    accessToken = null;
    TestBed.inject(HttpClient).get('https://api.racerlab.test/api/customers').subscribe();

    expect(refreshAccessToken).toHaveBeenCalledWith();
    const request = http.expectOne('https://api.racerlab.test/api/customers');
    expect(request.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    request.flush([]);
  });

  it('refreshes and retries a protected request once after a 401', () => {
    TestBed.inject(HttpClient).get('https://api.racerlab.test/api/customers').subscribe();
    http
      .expectOne('https://api.racerlab.test/api/customers')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(refreshAccessToken).toHaveBeenCalledWith('access-token');
    const retry = http.expectOne('https://api.racerlab.test/api/customers');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not refresh or redirect after a forbidden response', () => {
    let receivedError: HttpErrorResponse | undefined;
    TestBed.inject(HttpClient)
      .get('https://api.racerlab.test/api/customers')
      .subscribe({ error: (error) => (receivedError = error) });
    http
      .expectOne('https://api.racerlab.test/api/customers')
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(receivedError?.status).toBe(403);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not loop when the retried request is also unauthorized', () => {
    let receivedError: HttpErrorResponse | undefined;
    TestBed.inject(HttpClient)
      .get('https://api.racerlab.test/api/customers')
      .subscribe({ error: (error) => (receivedError = error) });
    http
      .expectOne('https://api.racerlab.test/api/customers')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('https://api.racerlab.test/api/customers')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(handleRefreshFailure).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/customers' },
    });
    expect(receivedError?.status).toBe(401);
  });

  it('returns to login when restoration from a missing token is unavailable', () => {
    accessToken = null;
    const unavailable = new AuthRefreshError('unavailable');
    refreshAccessToken.mockReturnValue(throwError(() => unavailable));
    handleRefreshFailure.mockReturnValue('unavailable');

    TestBed.inject(HttpClient)
      .get('https://api.racerlab.test/api/customers')
      .subscribe({ error: () => undefined });

    http.expectNone('https://api.racerlab.test/api/customers');
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/customers' },
    });
  });

  it('does not replace the first navigation when expiration is already handled', () => {
    sessionExpired = true;
    accessToken = null;
    refreshAccessToken.mockReturnValue(throwError(() => new AuthRefreshError('invalid')));

    TestBed.inject(HttpClient)
      .get('https://api.racerlab.test/api/customers')
      .subscribe({ error: () => undefined });

    expect(navigate).not.toHaveBeenCalled();
  });

});
