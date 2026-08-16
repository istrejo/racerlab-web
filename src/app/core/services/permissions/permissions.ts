import { computed, inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AuthService } from '@core/services/auth/auth';

/**
 * Derives role-based permission flags from the authenticated user's active
 * workshop role. This service is the single source of truth for access
 * control checks in guards and templates.
 *
 * Keeping permission logic here — rather than in AuthService — ensures
 * AuthService stays focused on session lifecycle while this service grows
 * alongside the product's permission model.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly auth = inject(AuthService);

  readonly canManageUsers = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN' || role === 'OWNER';
  });

  readonly canReadCustomers = computed(() => {
    const role = this.auth.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });

  readonly canWriteCustomers = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' || role === 'ADVISOR';
  });

  readonly canDeleteCustomers = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN';
  });

  readonly canReadVehicles = computed(() => {
    const role = this.auth.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });

  readonly canWriteVehicles = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' || role === 'ADVISOR';
  });

  readonly canDeleteVehicles = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN';
  });

  readonly canReadOrders = computed(() => {
    const role = this.auth.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });

  readonly canWriteOrders = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' || role === 'ADVISOR';
  });

  readonly canManageOrders = computed(() => {
    const role = this.auth.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });

  readonly canReadQuotes = computed(() => {
    const role = this.auth.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });

  readonly canWriteQuotes = computed(() => {
    const role = this.auth.role();
    return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' || role === 'ADVISOR';
  });
}
