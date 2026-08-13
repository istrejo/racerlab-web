import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService, SessionRestoreResult } from '@core/services/auth/auth';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let hasValidAccessToken: boolean;
  let requiresPasswordChange: boolean;
  let restoration: SessionRestoreResult;

  beforeEach(() => {
    hasValidAccessToken = false;
    requiresPasswordChange = false;
    restoration = 'anonymous';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasValidAccessToken: () => hasValidAccessToken,
            requiresPasswordChange: () => requiresPasswordChange,
            defaultAuthenticatedRoute: () =>
              requiresPasswordChange ? '/change-password' : '/dashboard',
            ensureSession: () => of(restoration),
          },
        },
      ],
    });
  });

  function run(url = '/dashboard') {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  async function resolveResult(url = '/dashboard'): Promise<boolean | UrlTree> {
    const result = run(url);
    return (isObservable(result) ? await firstValueFrom(result) : await result) as
      boolean | UrlTree;
  }

  it('allows a valid in-memory session without restoring it', async () => {
    hasValidAccessToken = true;
    expect(await resolveResult()).toBe(true);
  });

  it('restores a missing session before allowing a private route', async () => {
    restoration = 'authenticated';
    expect(await resolveResult('/customers')).toBe(true);
  });

  it('redirects an invalid session to login and preserves the requested route', async () => {
    restoration = 'anonymous';
    const result = await resolveResult('/customers/42');

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login?returnUrl=%2Fcustomers%2F42');
  });

  it('redirects temporary restoration failures to login', async () => {
    restoration = 'unavailable';
    const result = await resolveResult('/dashboard');

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('redirects a restored temporary-password session to the change screen', async () => {
    restoration = 'authenticated';
    requiresPasswordChange = true;

    expect((await resolveResult('/dashboard')).toString()).toBe(
      '/change-password?returnUrl=%2Fdashboard',
    );
  });

  it('allows the password-change route without creating a redirect loop', async () => {
    restoration = 'authenticated';
    requiresPasswordChange = true;

    expect(await resolveResult('/change-password')).toBe(true);
  });
});
