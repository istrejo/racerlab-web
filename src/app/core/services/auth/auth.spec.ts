import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { API_URL } from '@shared/utils/api-url.token';
import { AuthService } from './auth';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
      ],
    });

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the access token returned by the verified login contract', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      email: 'advisor@racerlab.test',
      password: 'password123',
    });
    request.flush({ accessToken: 'access-token', tokenType: 'Bearer' });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getAccessToken()).toBe('access-token');
  });

  it('restores an access token from the refresh cookie', async () => {
    const restoration = auth.restoreSession();
    const request = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    expect(request.request.withCredentials).toBe(true);
    request.flush({ accessToken: 'refreshed-token', tokenType: 'Bearer' });
    await restoration;

    expect(auth.getAccessToken()).toBe('refreshed-token');
  });

  it('fails closed when the refresh request times out', async () => {
    vi.useFakeTimers();
    try {
      auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
      http.expectOne('https://api.racerlab.test/api/auth/login').flush({
        accessToken: 'access-token',
        tokenType: 'Bearer',
      });

      const restoration = auth.restoreSession();
      http.expectOne('https://api.racerlab.test/api/auth/refresh');
      await vi.advanceTimersByTimeAsync(5_000);
      await restoration;

      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('fails closed when the auth response has no usable access token', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush({
      tokenType: 'Bearer',
    });

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getAccessToken()).toBeNull();
  });

  it('clears the in-memory access token after logout', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush({
      accessToken: 'access-token',
      tokenType: 'Bearer',
    });

    auth.logout().subscribe();
    const request = http.expectOne('https://api.racerlab.test/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.isAuthenticated()).toBe(false);
  });
});
