import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let accessToken: string | null | undefined;
  let requiresPasswordChange: boolean;

  beforeEach(() => {
    accessToken = null;
    requiresPasswordChange = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => accessToken,
            requiresPasswordChange: () => requiresPasswordChange,
          },
        },
      ],
    });
  });

  it('redirects a temporary-password session to the required change screen', () => {
    accessToken = 'access-token';
    requiresPasswordChange = true;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/change-password');
  });

  it('allows authenticated visitors', () => {
    accessToken = 'access-token';

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects anonymous visitors to login with their requested route', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('redirects visitors with a blank access token to login', () => {
    accessToken = ' ';

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
  });
});
