import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import {
  AuthRefreshSupersededError,
  AuthService,
  AuthSessionBootstrap,
  AuthTokenResponse,
} from './auth';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  const bootstrap: AuthSessionBootstrap = {
    user: { id: 'user-id', name: 'Ada Lovelace', email: 'ada@racerlab.test' },
    activeWorkshop: {
      workshopId: 'workshop-id',
      membershipId: 'membership-id',
      name: 'Racer Lab',
      role: 'OWNER',
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

  function token(expiresInSeconds = 300, subject = 'user-id'): string {
    const payload = btoa(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds, sub: subject }),
    );
    return `header.${payload}.signature`;
  }

  function response(overrides: Partial<AuthTokenResponse> = {}): AuthTokenResponse {
    return {
      accessToken: token(),
      tokenType: 'Bearer',
      activeWorkshop: {
        workshopId: 'workshop-id',
        membershipId: 'membership-id',
        name: 'Racer Lab',
        role: 'OWNER',
      },
      requiresWorkshopSelection: false,
      requiresPasswordChange: false,
      ...overrides,
    };
  }

  function completeProfile(overrides: Partial<AuthSessionBootstrap> = {}): void {
    const request = http.expectOne('https://api.racerlab.test/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush({ ...bootstrap, ...overrides });
  }

  async function allowRefreshToStart(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('stores login state immediately and loads the profile without blocking login', () => {
    let completed = false;
    auth.login({ email: 'advisor@racerlab.test', password: 'password123' }).subscribe({
      complete: () => (completed = true),
    });

    const request = http.expectOne('https://api.racerlab.test/api/auth/login');
    expect(request.request.withCredentials).toBe(true);
    request.flush(response());

    expect(completed).toBe(true);
    expect(auth.hasValidAccessToken()).toBe(true);
    expect(auth.sessionState()).toBe('authenticated');
    expect(auth.profileState()).toBe('loading');
    expect(auth.user()).toBeNull();

    completeProfile();
    expect(auth.user()?.email).toBe('ada@racerlab.test');
    expect(auth.profile()?.displayName).toBe('Ada');
    expect(auth.profileState()).toBe('ready');
  });

  it('creates a neutral signup session without waiting for the profile', () => {
    auth
      .signup({ name: 'Juan Pérez', email: 'juan@example.com', password: 'password123' })
      .subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/signup');
    expect(request.request.body).toEqual({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
    });
    request.flush(response({ activeWorkshop: null, requiresWorkshopSelection: true }));

    expect(auth.defaultAuthenticatedRoute()).toBe('/workshops/select');
    completeProfile({ activeWorkshop: null });
  });

  it('does not refresh when an access token is still valid', async () => {
    auth.applyTokenResponse(response()).subscribe();
    completeProfile();

    await expect(firstValueFrom(auth.ensureSession())).resolves.toBe('authenticated');
    http.expectNone('https://api.racerlab.test/api/auth/refresh');
  });

  it('restores a missing access token from the refresh cookie before loading the profile', async () => {
    const restoration = firstValueFrom(auth.ensureSession());
    expect(auth.sessionState()).toBe('restoring');
    await allowRefreshToStart();

    const request = http.expectOne('https://api.racerlab.test/api/auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    const refreshedToken = token();
    request.flush(response({ accessToken: refreshedToken }));

    await expect(restoration).resolves.toBe('authenticated');
    expect(auth.getAccessToken()).toBe(refreshedToken);
    expect(auth.profileState()).toBe('loading');
    completeProfile();
  });

  it('shares one refresh between simultaneous callers', async () => {
    const first = firstValueFrom(auth.refreshAccessToken());
    const second = firstValueFrom(auth.refreshAccessToken());
    await allowRefreshToStart();

    const requests = http.match('https://api.racerlab.test/api/auth/refresh');
    expect(requests).toHaveLength(1);
    const refreshedToken = token();
    requests[0].flush(response({ accessToken: refreshedToken }));

    await expect(Promise.all([first, second])).resolves.toEqual([refreshedToken, refreshedToken]);
  });

  it('shares the complete session restoration between simultaneous guards', async () => {
    const first = firstValueFrom(auth.ensureSession());
    const second = firstValueFrom(auth.ensureSession());
    await allowRefreshToStart();

    const requests = http.match('https://api.racerlab.test/api/auth/refresh');
    expect(requests).toHaveLength(1);
    requests[0].flush(response());

    await expect(Promise.all([first, second])).resolves.toEqual([
      'authenticated',
      'authenticated',
    ]);
    expect(auth.profileState()).toBe('loading');
    completeProfile();
  });

  it('marks an invalid refresh session as anonymous', async () => {
    const restoration = firstValueFrom(auth.ensureSession());
    await allowRefreshToStart();
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(restoration).resolves.toBe('anonymous');
    expect(auth.sessionState()).toBe('anonymous');
    expect(auth.getAccessToken()).toBeNull();
    expect(auth.sessionExpired()).toBe(true);
  });

  it('silently allows a guest route when no refresh session exists', async () => {
    const restoration = firstValueFrom(auth.probeSession());
    await allowRefreshToStart();
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(restoration).resolves.toBe('anonymous');
    expect(auth.sessionState()).toBe('anonymous');
    expect(auth.sessionExpired()).toBe(false);
    expect(auth.sessionClosed()).toBe(false);
  });

  it('starts the profile load after a cookie-backed guest session is restored', async () => {
    const probe = firstValueFrom(auth.probeSession());
    await allowRefreshToStart();
    http.expectOne('https://api.racerlab.test/api/auth/refresh').flush(response());

    await expect(probe).resolves.toBe('authenticated');
    expect(auth.profileState()).toBe('loading');
    completeProfile();
  });

  it('shares only the refresh while private restoration keeps its own failure policy', async () => {
    const guestProbe = firstValueFrom(auth.probeSession());
    const privateRestoration = firstValueFrom(auth.ensureSession());
    await allowRefreshToStart();

    const requests = http.match('https://api.racerlab.test/api/auth/refresh');
    expect(requests).toHaveLength(1);
    requests[0].flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(guestProbe).resolves.toBe('anonymous');
    await expect(privateRestoration).resolves.toBe('anonymous');
    expect(auth.sessionExpired()).toBe(true);
  });

  it('ignores a stale refresh failure after a newer session is accepted', async () => {
    const probe = firstValueFrom(auth.probeSession());
    await allowRefreshToStart();
    const staleRefresh = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    const newerToken = token(600, 'new-user');
    auth.applyTokenResponse(response({ accessToken: newerToken })).subscribe();
    const profileRequest = http.expectOne('https://api.racerlab.test/api/auth/me');
    staleRefresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(probe).resolves.toBe('authenticated');
    expect(auth.getAccessToken()).toBe(newerToken);
    expect(auth.sessionExpired()).toBe(false);
    profileRequest.flush({
      ...bootstrap,
      user: { ...bootstrap.user, id: 'new-user' },
    });
  });

  it('does not reuse a newer identity for a refresh started by another user', async () => {
    const originalToken = token(30, 'old-user');
    auth.applyTokenResponse(response({ accessToken: originalToken })).subscribe();
    completeProfile({ user: { ...bootstrap.user, id: 'old-user' } });

    const refresh = firstValueFrom(auth.refreshAccessToken(originalToken));
    await allowRefreshToStart();
    const staleRefresh = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    const newerToken = token(600, 'new-user');
    auth.applyTokenResponse(response({ accessToken: newerToken })).subscribe();
    const newProfile = http.expectOne('https://api.racerlab.test/api/auth/me');
    staleRefresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(refresh).rejects.toBeInstanceOf(AuthRefreshSupersededError);
    expect(auth.getAccessToken()).toBe(newerToken);
    expect(auth.sessionExpired()).toBe(false);
    newProfile.flush({
      ...bootstrap,
      user: { ...bootstrap.user, id: 'new-user' },
    });
  });

  it('does not adopt a new session for a refresh started without an access token', async () => {
    const refresh = firstValueFrom(auth.refreshAccessToken());
    await allowRefreshToStart();
    const staleRefresh = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    const newerToken = token(600, 'new-user');
    auth.applyTokenResponse(response({ accessToken: newerToken })).subscribe();
    const newProfile = http.expectOne('https://api.racerlab.test/api/auth/me');
    staleRefresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(refresh).rejects.toBeInstanceOf(AuthRefreshSupersededError);
    expect(auth.getAccessToken()).toBe(newerToken);
    newProfile.flush({
      ...bootstrap,
      user: { ...bootstrap.user, id: 'new-user' },
    });
  });

  it('does not turn a logout during restoration into session expiration', async () => {
    const restoration = firstValueFrom(auth.ensureSession());
    await allowRefreshToStart();
    const staleRefresh = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    auth.logout().subscribe({ error: () => undefined });
    staleRefresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(restoration).resolves.toBe('anonymous');
    expect(auth.sessionExpired()).toBe(false);
    http
      .expectOne('https://api.racerlab.test/api/auth/logout')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.sessionExpired()).toBe(false);
  });

  it('keeps a retryable state when refresh times out', async () => {
    vi.useFakeTimers();
    try {
      const restoration = firstValueFrom(auth.ensureSession());
      await vi.advanceTimersByTimeAsync(0);
      http.expectOne('https://api.racerlab.test/api/auth/refresh');
      await vi.advanceTimersByTimeAsync(5_000);

      await expect(restoration).resolves.toBe('unavailable');
      expect(auth.sessionState()).toBe('anonymous');
      expect(auth.sessionExpired()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects an auth response without a valid exp claim', () => {
    let failed = false;
    auth
      .login({ email: 'advisor@racerlab.test', password: 'password123' })
      .subscribe({ error: () => (failed = true) });
    http
      .expectOne('https://api.racerlab.test/api/auth/login')
      .flush(response({ accessToken: 'not-a-jwt' }));

    expect(failed).toBe(true);
    expect(auth.hasValidAccessToken()).toBe(false);
    expect(auth.sessionState()).toBe('anonymous');
  });

  it('rejects an auth response whose access token is already expired', () => {
    let failed = false;
    auth
      .login({ email: 'advisor@racerlab.test', password: 'password123' })
      .subscribe({ error: () => (failed = true) });
    http
      .expectOne('https://api.racerlab.test/api/auth/login')
      .flush(response({ accessToken: token(-10) }));

    expect(failed).toBe(true);
    expect(auth.sessionState()).toBe('anonymous');
  });

  it('renews a token inside the preventive refresh window', async () => {
    const expiringToken = token(30);
    auth.applyTokenResponse(response({ accessToken: expiringToken })).subscribe();
    completeProfile();
    expect(auth.hasValidAccessToken()).toBe(true);
    expect(auth.needsRefresh()).toBe(true);

    const refresh = firstValueFrom(auth.refreshAccessToken());
    await allowRefreshToStart();
    const refreshedToken = token(300);
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(response({ accessToken: refreshedToken }));

    await expect(refresh).resolves.toBe(refreshedToken);
  });

  it('keeps the loaded profile across a token-only refresh for the same session context', async () => {
    auth.applyTokenResponse(response()).subscribe();
    completeProfile();

    const refresh = firstValueFrom(auth.refreshAccessToken(auth.getAccessToken()!));
    await allowRefreshToStart();
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(response({ accessToken: token(300) }));
    await refresh;

    expect(auth.user()?.name).toBe('Ada Lovelace');
    expect(auth.profile()?.displayName).toBe('Ada');
    expect(auth.profileState()).toBe('ready');
    http.expectNone('https://api.racerlab.test/api/auth/me');
  });

  it('reloads the profile when a cross-login token belongs to another user', () => {
    auth.applyTokenResponse(response()).subscribe();
    completeProfile();

    auth.applyTokenResponse(response({ accessToken: token(300, 'second-user') })).subscribe();

    expect(auth.user()).toBeNull();
    expect(auth.profileState()).toBe('loading');
    completeProfile({
      user: { id: 'second-user', name: 'Grace Hopper', email: 'grace@racerlab.test' },
    });
  });

  it('ignores stale profile data after changing workshop context', () => {
    auth.applyTokenResponse(response()).subscribe();
    const staleProfile = http.expectOne('https://api.racerlab.test/api/auth/me');

    auth
      .applyTokenResponse(
        response({
          accessToken: token(300),
          activeWorkshop: {
            workshopId: 'second-workshop',
            membershipId: 'second-membership',
            name: 'Racer Lab Sur',
            role: 'ADMIN',
          },
        }),
      )
      .subscribe();

    staleProfile.flush(bootstrap);
    expect(auth.activeWorkshop()?.workshopId).toBe('second-workshop');

    completeProfile({
      activeWorkshop: {
        workshopId: 'second-workshop',
        membershipId: 'second-membership',
        name: 'Racer Lab Sur',
        role: 'ADMIN',
        profile: { displayName: 'Ada', phone: null, address: null },
      },
    });
  });

  it('keeps the authenticated route context when profile loading fails temporarily', () => {
    auth.applyTokenResponse(response()).subscribe();
    http
      .expectOne('https://api.racerlab.test/api/auth/me')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(auth.hasValidAccessToken()).toBe(true);
    expect(auth.activeWorkshop()?.workshopId).toBe('workshop-id');
    expect(auth.profileState()).toBe('error');
  });

  it('clears the in-memory session after logout', () => {
    auth.applyTokenResponse(response()).subscribe();
    completeProfile();

    auth.logout().subscribe();
    const request = http.expectOne('https://api.racerlab.test/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.sessionState()).toBe('anonymous');
    expect(auth.sessionExpired()).toBe(false);
  });

  it('dismisses the expired-session notification', async () => {
    const restoration = firstValueFrom(auth.ensureSession());
    await allowRefreshToStart();
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await restoration;

    auth.dismissSessionExpired();
    expect(auth.sessionExpired()).toBe(false);
  });

  it('does not restore a session from a refresh response received after logout', async () => {
    auth.applyTokenResponse(response()).subscribe();
    completeProfile();

    const refresh = firstValueFrom(auth.refreshAccessToken(auth.getAccessToken()!));
    await allowRefreshToStart();
    const refreshRequest = http.expectOne('https://api.racerlab.test/api/auth/refresh');

    auth.logout().subscribe();
    expect(auth.sessionState()).toBe('anonymous');
    refreshRequest.flush(response({ accessToken: token(600) }));
    await expect(refresh).rejects.toBeDefined();

    const logoutRequest = http.expectOne('https://api.racerlab.test/api/auth/logout');
    logoutRequest.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.getAccessToken()).toBeNull();
  });

  it('ignores a profile response received after logout', () => {
    auth.applyTokenResponse(response()).subscribe();
    const profileRequest = http.expectOne('https://api.racerlab.test/api/auth/me');

    auth.logout().subscribe();
    profileRequest.flush(bootstrap);
    http
      .expectOne('https://api.racerlab.test/api/auth/logout')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.user()).toBeNull();
    expect(auth.activeWorkshop()).toBeNull();
    expect(auth.sessionState()).toBe('anonymous');
  });

  it.each([
    ['OWNER', true, true, true],
    ['ADMIN', true, true, true],
    ['MANAGER', true, true, false],
    ['ADVISOR', true, true, false],
    ['TECHNICIAN', true, false, false],
    ['INVENTORY_MANAGER', false, false, false],
  ] as const)('maps the %s role to customer permissions', (role, canRead, canWrite, canDelete) => {
    auth
      .applyTokenResponse(
        response({
          activeWorkshop: {
            workshopId: 'workshop-id',
            membershipId: 'membership-id',
            name: 'Racer Lab',
            role,
          },
        }),
      )
      .subscribe();

    expect(auth.canReadCustomers()).toBe(canRead);
    expect(auth.canWriteCustomers()).toBe(canWrite);
    expect(auth.canDeleteCustomers()).toBe(canDelete);
    completeProfile();
  });
});
