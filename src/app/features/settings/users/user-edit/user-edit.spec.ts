import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { MembershipsService } from '@core/services/memberships/memberships';
import { Membership } from '@core/models/membership.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import UserEditComponent from './user-edit';

describe('UserEditComponent', () => {
  const membershipId = 'membership-1';
  const membership: Membership = {
    id: membershipId,
    workshopId: 'workshop-1',
    role: 'TECHNICIAN',
    name: 'Juan Pérez',
    phone: null,
    address: null,
    isActive: true,
    user: {
      id: 'user-1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      isActive: true,
      mustChangePassword: false,
    },
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(
    memberships: Partial<MembershipsService>,
    activeMembershipId = 'someone-else',
  ) {
    TestBed.configureTestingModule({
      imports: [UserEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: membershipId }) } },
        },
        {
          provide: AuthService,
          useValue: { activeWorkshop: () => ({ membershipId: activeMembershipId }) },
        },
        { provide: MembershipsService, useValue: memberships },
      ],
    });
    return TestBed.createComponent(UserEditComponent).componentInstance;
  }

  it('loads the membership and fills the form for a non-owner role', () => {
    const component = createWith({ get: () => of(membership) });

    expect(component.membership()).toEqual(membership);
    expect(component.form.controls.name.value).toBe('Juan Pérez');
    expect(component.loading()).toBe(false);
  });

  it('disables role and status controls when editing the current membership', () => {
    const component = createWith({ get: () => of(membership) }, membershipId);

    expect(component.form.controls.role.disabled).toBe(true);
    expect(component.form.controls.isActive.disabled).toBe(true);
  });

  it('shows a load error when the membership cannot be fetched', () => {
    const component = createWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.error()).toBe('No pudimos cargar este usuario.');
  });

  it('navigates back to the user list after a successful save', () => {
    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    const component = createWith({ get: () => of(membership), update: () => of(membership) });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(navigateByUrl);

    component.save();

    expect(navigateByUrl).toHaveBeenCalledWith('/settings/users');
  });

  it('shows a generic error when saving fails', () => {
    const component = createWith({
      get: () => of(membership),
      update: () => throwError(() => new Error('fail')),
    });

    component.save();

    expect(component.error()).toBe('No pudimos guardar los cambios.');
    expect(component.pending()).toBe(false);
  });

  it('resets the password and stores the credentials in memory', () => {
    const component = createWith({
      get: () => of(membership),
      resetPassword: () => of(undefined),
    });

    component.openReset();
    const password = component.resetForm.controls.temporaryPassword.value;
    component.resetPassword();

    expect(component.resetCredentials()).toBe(password);
    expect(component.resetPending()).toBe(false);
  });

  it('shows a reset error when the password reset request fails', () => {
    const component = createWith({
      get: () => of(membership),
      resetPassword: () => throwError(() => new Error('fail')),
    });

    component.openReset();
    component.resetPassword();

    expect(component.resetError()).toBe('No pudimos restablecer la contraseña.');
    expect(component.resetPending()).toBe(false);
  });
});
