import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { customerReadGuard } from './customer-read-guard';

describe('customerReadGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canReadCustomers: () => allowed } },
      ],
    });
  });

  it('allows roles with customer read permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      customerReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects inventory managers to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      customerReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
