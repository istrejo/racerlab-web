import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const vehicleReadGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canReadVehicles() ? true : inject(Router).createUrlTree(['/dashboard']);
};
