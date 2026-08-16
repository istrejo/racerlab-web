import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { quoteWriteGuard } from './quote-write-guard';

describe('quoteWriteGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canWriteQuotes: () => allowed } },
      ],
    });
  });

  it('allows roles with quote write permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      quoteWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthorized roles to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      quoteWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
