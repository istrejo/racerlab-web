import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { passwordChangeGuard } from './password-change-guard';

describe('passwordChangeGuard', () => {
  let requiresPasswordChange: boolean;

  beforeEach(() => {
    requiresPasswordChange = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            requiresPasswordChange: () => requiresPasswordChange,
            defaultAuthenticatedRoute: () => '/dashboard',
          },
        },
      ],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() =>
      passwordChangeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('allows access when the account requires a password change', () => {
    requiresPasswordChange = true;
    expect(run()).toBe(true);
  });

  it('redirects to the default authenticated route otherwise', () => {
    requiresPasswordChange = false;
    const result = run();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
