import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const customerReadGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canReadCustomers() ? true : inject(Router).createUrlTree(['/dashboard']);
};
