import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { quoteReadGuard } from './quote-read-guard';

describe('quoteReadGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canReadQuotes: () => allowed } },
      ],
    });
  });

  it('allows roles with quote read permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      quoteReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthorized roles to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      quoteReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
