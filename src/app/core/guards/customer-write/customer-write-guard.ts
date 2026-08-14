import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const customerWriteGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canWriteCustomers() ? true : inject(Router).createUrlTree(['/customers']);
};
