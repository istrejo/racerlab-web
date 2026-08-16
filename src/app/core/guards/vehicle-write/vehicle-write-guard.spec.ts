import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { vehicleWriteGuard } from './vehicle-write-guard';

describe('vehicleWriteGuard', () => {
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: { canWriteVehicles: () => allowed } },
      ],
    });
  });

  it('allows roles with vehicle write permission', () => {
    allowed = true;
    const result = TestBed.runInInjectionContext(() =>
      vehicleWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthorized roles to the dashboard', () => {
    const result = TestBed.runInInjectionContext(() =>
      vehicleWriteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
