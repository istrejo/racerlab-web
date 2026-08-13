import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { firstValueFrom } from 'rxjs';
import { AuthRefreshError, AuthService, AuthTokenResponse } from './auth';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  const response: AuthTokenResponse = {
    accessToken: 'access-token',
    tokenType: 'Bearer',
    user: { id: 'user-id', name: 'Ada Lovelace', email: 'ada@racerlab.test' },
    activeWorkshop: {
      workshopId: 'workshop-id',
      membershipId: 'membership-id',
      name: 'Racer Lab',
      role: 'OWNER',
      profile: { displayName: 'Ada', phone: null, address: null },
    },
    requiresWorkshopSelection: false,
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

  it('applies the complete login response without requesting /auth/me', async () => {
    const login = firstValueFrom(
      auth.login({ email: 'ada@racerlab.test', password: 'password123' }),
    );
    const request = http.expectOne('https://api.racerlab.test/api/auth/login');
    expect(request.request.withCredentials).toBe(true);
    request.flush(response);
    await login;

    expect(auth.getAccessToken()).toBe('access-token');
    expect(auth.user()).toEqual(response.user);
    expect(auth.profile()).toEqual(response.activeWorkshop?.profile);
    expect(auth.sessionState()).toBe('authenticated');
    expect(auth.profileState()).toBe('ready');
    http.expectNone('https://api.racerlab.test/api/auth/me');
  });

  it('does not refresh while an access token is present', async () => {
    await firstValueFrom(auth.applyTokenResponse(response));

    await expect(firstValueFrom(auth.ensureSession())).resolves.toBe('authenticated');
    http.expectNone('https://api.racerlab.test/api/auth/refresh');
  });

  it('restores a missing in-memory token from the refresh cookie', async () => {
    const restoration = firstValueFrom(auth.ensureSession());
    const request = http.expectOne('https://api.racerlab.test/api/auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    request.flush(response);

    await expect(restoration).resolves.toBe('authenticated');
    expect(auth.user()).toEqual(response.user);
  });

  it('shares one refresh request between simultaneous consumers', async () => {
    const first = firstValueFrom(auth.refreshAccessToken());
    const second = firstValueFrom(auth.refreshAccessToken());
    const requests = http.match('https://api.racerlab.test/api/auth/refresh');
    expect(requests).toHaveLength(1);
    requests[0].flush(response);

    await expect(Promise.all([first, second])).resolves.toEqual([
      'access-token',
      'access-token',
    ]);
  });

  it('reuses a replacement already installed by another request in the tab', async () => {
    await firstValueFrom(auth.applyTokenResponse(response));
    await firstValueFrom(
      auth.applyTokenResponse({ ...response, accessToken: 'replacement-access-token' }),
    );

    await expect(firstValueFrom(auth.refreshAccessToken('access-token'))).resolves.toBe(
      'replacement-access-token',
    );
    http.expectNone('https://api.racerlab.test/api/auth/refresh');
  });

  it('classifies an invalid refresh and clears local authentication state', async () => {
    await firstValueFrom(auth.applyTokenResponse(response));
    const refresh = firstValueFrom(auth.refreshAccessToken('access-token'));
    http
      .expectOne('https://api.racerlab.test/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(refresh).rejects.toBeInstanceOf(AuthRefreshError);
    auth.handleRefreshFailure(new AuthRefreshError('invalid'));
    expect(auth.getAccessToken()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(auth.sessionExpired()).toBe(true);
  });

  it('clears local state immediately when logging out', async () => {
    await firstValueFrom(auth.applyTokenResponse(response));
    const logout = firstValueFrom(auth.logout());

    expect(auth.getAccessToken()).toBeNull();
    const request = http.expectOne('https://api.racerlab.test/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);
    await logout;
  });
});
