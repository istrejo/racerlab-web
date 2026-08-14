import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const adminGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);

  return permissions.canManageUsers() ? true : inject(Router).createUrlTree(['/dashboard']);
};
