import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth/auth';
import { PermissionsService } from './permissions';
import type { UserRole } from '@core/models/auth.interface';

describe('PermissionsService', () => {
  const role = signal<UserRole | null>(null);

  beforeEach(() => {
    role.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { role } }],
    });
  });

  function permissions(): PermissionsService {
    return TestBed.inject(PermissionsService);
  }

  describe('canManageUsers', () => {
    it.each<[UserRole | null, boolean]>([
      ['OWNER', true],
      ['ADMIN', true],
      ['MANAGER', false],
      ['ADVISOR', false],
      ['TECHNICIAN', false],
      ['INVENTORY_MANAGER', false],
      [null, false],
    ])('role %s → %s', (r, expected) => {
      role.set(r);
      expect(permissions().canManageUsers()).toBe(expected);
    });
  });

  describe('canReadCustomers', () => {
    it.each<[UserRole | null, boolean]>([
      ['OWNER', true],
      ['ADMIN', true],
      ['MANAGER', true],
      ['ADVISOR', true],
      ['TECHNICIAN', true],
      ['INVENTORY_MANAGER', false],
      [null, false],
    ])('role %s → %s', (r, expected) => {
      role.set(r);
      expect(permissions().canReadCustomers()).toBe(expected);
    });
  });

  describe('canWriteCustomers', () => {
    it.each<[UserRole | null, boolean]>([
      ['OWNER', true],
      ['ADMIN', true],
      ['MANAGER', true],
      ['ADVISOR', true],
      ['TECHNICIAN', false],
      ['INVENTORY_MANAGER', false],
      [null, false],
    ])('role %s → %s', (r, expected) => {
      role.set(r);
      expect(permissions().canWriteCustomers()).toBe(expected);
    });
  });

  describe('canDeleteCustomers', () => {
    it.each<[UserRole | null, boolean]>([
      ['OWNER', true],
      ['ADMIN', true],
      ['MANAGER', false],
      ['ADVISOR', false],
      ['TECHNICIAN', false],
      ['INVENTORY_MANAGER', false],
      [null, false],
    ])('role %s → %s', (r, expected) => {
      role.set(r);
      expect(permissions().canDeleteCustomers()).toBe(expected);
    });
  });
});
