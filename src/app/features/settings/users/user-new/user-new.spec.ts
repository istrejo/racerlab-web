import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MembershipsService } from '@core/services/memberships/memberships';
import { UserNewComponent, createTemporaryPassword } from './user-new';

describe('UserNewComponent', () => {
  const create = vi.fn();

  beforeEach(async () => {
    create.mockReset();
    await TestBed.configureTestingModule({
      imports: [UserNewComponent],
      providers: [provideRouter([]), { provide: MembershipsService, useValue: { create } }],
    }).compileComponents();
  });

  it('generates temporary passwords accepted by the API contract', () => {
    expect(createTemporaryPassword()).toHaveLength(16);
  });

  it('keeps submitted credentials in memory after a successful creation', () => {
    create.mockReturnValue(
      of({
        name: 'Juan Pérez',
        user: { email: 'juan@example.com' },
      }),
    );
    const component = TestBed.createComponent(UserNewComponent).componentInstance;
    component.form.setValue({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '',
      address: '',
      role: 'TECHNICIAN',
      password: 'temporary-secret',
    });

    component.submit();

    expect(create).toHaveBeenCalledWith({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: null,
      address: null,
      role: 'TECHNICIAN',
      password: 'temporary-secret',
    });
    expect(component.credentials()).toEqual({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'temporary-secret',
    });
    expect(component.form.controls.password.value).toBe('');
  });
});
