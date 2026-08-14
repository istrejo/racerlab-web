import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { serviceOrderReadGuard } from './service-order-read-guard';

describe('serviceOrderReadGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canReadOrders: () => allowed } },
      ],
    });
  });

  it('allows roles with order read permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      serviceOrderReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthorized roles to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      serviceOrderReadGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
