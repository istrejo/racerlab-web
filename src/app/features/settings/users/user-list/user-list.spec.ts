import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MembershipsService } from '@core/services/memberships/memberships';
import { Membership } from '@core/models/membership.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import UserListComponent from './user-list';

describe('UserListComponent', () => {
  const membership: Membership = {
    id: 'membership-1',
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

  function createWith(list: ReturnType<typeof vi.fn>) {
    TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [provideRouter([]), { provide: MembershipsService, useValue: { list } }],
    });
    return TestBed.createComponent(UserListComponent).componentInstance;
  }

  it('loads the workshop memberships on construction', () => {
    const list = vi.fn(() => of([membership]));
    const component = createWith(list);

    expect(list).toHaveBeenCalled();
    expect(component.memberships()).toEqual([membership]);
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when memberships cannot be fetched', () => {
    const component = createWith(vi.fn(() => throwError(() => new Error('fail'))));

    expect(component.error()).toBe('No pudimos cargar los usuarios del taller.');
    expect(component.loading()).toBe(false);
  });
});
