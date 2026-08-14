import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const serviceOrderReadGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canReadOrders() ? true : inject(Router).createUrlTree(['/dashboard']);
};
