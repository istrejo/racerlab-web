import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const vehicleWriteGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canWriteVehicles() ? true : inject(Router).createUrlTree(['/dashboard']);
};
