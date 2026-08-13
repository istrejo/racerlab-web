import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { API_URL } from '@shared/utils/api-url.token';
import { AuthService, AuthSessionBootstrap } from './auth';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const response = {
    accessToken: 'access-token',
    tokenType: 'Bearer' as const,
    activeWorkshop: {
      workshopId: 'workshop-id',
      membershipId: 'membership-id',
      name: 'Racer Lab',
      role: 'OWNER' as const,
    },
    requiresWorkshopSelection: false,
    requiresPasswordChange: false,
  };
  const bootstrap: AuthSessionBootstrap = {
    user: { id: 'user-id', name: 'Ada Lovelace', email: 'ada@racerlab.test' },
    activeWorkshop: {
      ...response.activeWorkshop,
      profile: { displayName: 'Ada', phone: null, address: null },
    },
    requiresPasswordChange: false,
  };

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

  function completeBootstrap(overrides: Partial<typeof bootstrap> = {}): void {
    const request = http.expectOne('https://api.racerlab.test/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush({ ...bootstrap, ...overrides });
  }

  it('stores the access token returned by the verified login contract', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      email: 'advisor@racerlab.test',
      password: 'password123',
    });
    request.flush(response);
    completeBootstrap();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getAccessToken()).toBe('access-token');
    expect(auth.user()?.email).toBe('ada@racerlab.test');
    expect(auth.profile()?.displayName).toBe('Ada');
    expect(auth.sessionBootstrapState()).toBe('ready');
  });

  it('creates an identity, stores its neutral session and omits password confirmation', () => {
    auth
      .signup({
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123',
      })
      .subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/signup');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
    });
    request.flush({
      ...response,
      activeWorkshop: null,
      requiresWorkshopSelection: true,
    });
    completeBootstrap({ activeWorkshop: null });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.hasActiveWorkshop()).toBe(false);
    expect(auth.defaultAuthenticatedRoute()).toBe('/workshops/select');
  });

  it('restores an access token from the refresh cookie', async () => {
    const restoration = auth.restoreSession();
    const request = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    expect(request.request.withCredentials).toBe(true);
    request.flush({ ...response, accessToken: 'refreshed-token' });
    completeBootstrap();
    await restoration;

    expect(auth.getAccessToken()).toBe('refreshed-token');
  });

  it('fails closed when the refresh request times out', async () => {
    vi.useFakeTimers();
    try {
      auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
      http.expectOne('https://api.racerlab.test/api/auth/login').flush(response);
      completeBootstrap();

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
      ...response,
      accessToken: undefined,
      tokenType: 'Bearer',
    });

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getAccessToken()).toBeNull();
  });

  it('clears the in-memory access token after logout', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush(response);
    completeBootstrap();

    auth.logout().subscribe();
    const request = http.expectOne('https://api.racerlab.test/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('keeps the live workshop, role and forced password state', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush({
      ...response,
      requiresPasswordChange: true,
    });
    completeBootstrap({ requiresPasswordChange: true });

    expect(auth.activeWorkshop()?.name).toBe('Racer Lab');
    expect(auth.role()).toBe('OWNER');
    expect(auth.canManageUsers()).toBe(true);
    expect(auth.requiresPasswordChange()).toBe(true);
  });

  it('clears the forced flag after changing the password', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush({
      ...response,
      requiresPasswordChange: true,
    });
    completeBootstrap({ requiresPasswordChange: true });

    auth.changePassword('temporary-password', 'new-password').subscribe();
    const request = http.expectOne('https://api.racerlab.test/api/auth/change-password');
    expect(request.request.body).toEqual({
      currentPassword: 'temporary-password',
      newPassword: 'new-password',
    });
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.requiresPasswordChange()).toBe(false);
  });

  it('clears authentication when the bootstrap rejects the bearer session', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush(response);
    http
      .expectOne('https://api.racerlab.test/api/auth/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.activeWorkshop()).toBeNull();
  });

  it('preserves signed token context when bootstrap fails transiently', () => {
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe();
    http.expectOne('https://api.racerlab.test/api/auth/login').flush(response);
    http
      .expectOne('https://api.racerlab.test/api/auth/me')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(auth.getAccessToken()).toBe('access-token');
    expect(auth.activeWorkshop()?.workshopId).toBe('workshop-id');
    expect(auth.sessionBootstrapState()).toBe('error');
  });

  it('routes authenticated sessions without an active workshop to selection', () => {
    auth.applyTokenResponse({
      ...response,
      activeWorkshop: null,
      requiresWorkshopSelection: true,
    });

    expect(auth.hasActiveWorkshop()).toBe(false);
    expect(auth.defaultAuthenticatedRoute()).toBe('/workshops/select');
  });

  it('prioritizes the mandatory password change before workshop onboarding', () => {
    auth.applyTokenResponse({
      ...response,
      activeWorkshop: null,
      requiresWorkshopSelection: true,
      requiresPasswordChange: true,
    });

    expect(auth.defaultAuthenticatedRoute()).toBe('/change-password');
  });
});
