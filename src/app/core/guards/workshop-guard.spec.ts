import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, map, of } from 'rxjs';
import { AuthService, SessionRestoreResult } from '../services/auth/auth';
import { workshopGuard } from './workshop-guard';

describe('workshopGuard', () => {
  let hasValidAccessToken: boolean;
  let hasActiveWorkshop: boolean;
  let requiresPasswordChange: boolean;
  let restoration: SessionRestoreResult;

  beforeEach(() => {
    hasValidAccessToken = true;
    hasActiveWorkshop = false;
    requiresPasswordChange = false;
    restoration = 'authenticated';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasValidAccessToken: () => hasValidAccessToken,
            hasActiveWorkshop: () => hasActiveWorkshop,
            requiresPasswordChange: () => requiresPasswordChange,
            ensureSession: () =>
              of(restoration).pipe(
                map((result) => {
                  if (result === 'authenticated') {
                    hasValidAccessToken = true;
                  }
                  return result;
                }),
              ),
          },
        },
      ],
    });
  });

  function run(url = '/dashboard') {
    return TestBed.runInInjectionContext(() =>
      workshopGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  async function resolveResult(url = '/dashboard'): Promise<boolean | UrlTree> {
    const result = run(url);
    return (isObservable(result) ? await firstValueFrom(result) : await result) as
      | boolean
      | UrlTree;
  }

  it('allows a session with an active workshop', () => {
    hasActiveWorkshop = true;

    expect(run()).toBe(true);
  });

  it('redirects a neutral session to workshop selection', () => {
    const result = run('/customers/42');

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/workshops/select?returnUrl=%2Fcustomers%2F42');
  });

  it('waits for session restoration before deciding whether a workshop is missing', async () => {
    hasValidAccessToken = false;
    const auth = TestBed.inject(AuthService);
    auth.ensureSession = () => {
      hasActiveWorkshop = true;
      return of('authenticated');
    };

    expect(await resolveResult('/customers/42')).toBe(true);
  });

  it('defers workshop selection while password change is required', () => {
    requiresPasswordChange = true;

    expect(run('/dashboard')).toBe(true);
  });

  it('redirects a failed restoration to login instead of workshop selection', async () => {
    hasValidAccessToken = false;
    restoration = 'anonymous';

    const result = await resolveResult('/customers/42');
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login?returnUrl=%2Fcustomers%2F42');
  });
});
