import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { serviceOrderWriteGuard } from './service-order-write-guard';

describe('serviceOrderWriteGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canWriteOrders: () => allowed } },
      ],
    });
  });

  it('allows roles with order write permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      serviceOrderWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects technicians and unauthorized roles to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      serviceOrderWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
