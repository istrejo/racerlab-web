import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService, SessionRestoreResult } from '../services/auth/auth';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
  let authenticated: boolean;
  let restoration: SessionRestoreResult;
  let probeSessionCalls: number;

  beforeEach(() => {
    authenticated = false;
    restoration = 'anonymous';
    probeSessionCalls = 0;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasValidAccessToken: () => authenticated,
            defaultAuthenticatedRoute: () => '/dashboard',
            probeSession: () => {
              probeSessionCalls += 1;
              return of(restoration);
            },
          },
        },
      ],
    });
  });

  function run(returnUrl?: string) {
    const route = {
      queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
    } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      guestGuard(route, { url: '/login' } as RouterStateSnapshot),
    );
  }

  async function resolveResult(returnUrl?: string): Promise<boolean | UrlTree> {
    const result = run(returnUrl);
    return (isObservable(result) ? await firstValueFrom(result) : await result) as
      | boolean
      | UrlTree;
  }

  it('redirects an already active in-memory session without refreshing', async () => {
    authenticated = true;
    const result = await resolveResult();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
    expect(probeSessionCalls).toBe(0);
  });

  it('restores a cookie-backed session before allowing login', async () => {
    restoration = 'authenticated';

    const result = await resolveResult('/customers/42');

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/customers/42');
    expect(probeSessionCalls).toBe(1);
  });

  it.each(['anonymous', 'unavailable'] as const)(
    'allows login when silent restoration returns %s',
    async (result) => {
      restoration = result;

      expect(await resolveResult()).toBe(true);
      expect(probeSessionCalls).toBe(1);
    },
  );

  it('rejects an external return URL for an authenticated session', async () => {
    authenticated = true;

    const result = await resolveResult('//evil.example');
    expect(result.toString()).toBe('/dashboard');
  });
});
