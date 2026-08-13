import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { customerWriteGuard } from './customer-write-guard';

describe('customerWriteGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { canWriteCustomers: () => allowed } },
      ],
    });
  });

  it('allows customer managers', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      customerWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects read-only roles to the customer list', () => {
    const result = TestBed.runInInjectionContext(() =>
      customerWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/customers');
  });
});
