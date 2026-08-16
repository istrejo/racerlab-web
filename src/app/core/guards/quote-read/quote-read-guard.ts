import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

export const quoteReadGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  return permissions.canReadQuotes() ? true : inject(Router).createUrlTree(['/dashboard']);
};
