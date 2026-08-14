import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const serviceOrderWriteGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canWriteOrders() ? true : inject(Router).createUrlTree(['/dashboard']);
};
