import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth/auth';
import { WorkshopsService } from '@core/services/workshops/workshops';
import { WorkshopNewComponent } from './workshop-new';

describe('WorkshopNewComponent', () => {
  const create = vi.fn();
  const logout = vi.fn();
  const navigateByUrl = vi.fn(() => Promise.resolve(true));

  beforeEach(async () => {
    create.mockReset();
    logout.mockReset();
    navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [WorkshopNewComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasActiveWorkshop: () => false,
            logout,
          },
        },
        { provide: WorkshopsService, useValue: { create } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).compileComponents();
  });

  it('does not submit a blank workshop name', () => {
    const component = TestBed.createComponent(WorkshopNewComponent).componentInstance;
    component.form.controls.name.setValue('   ');

    component.submit();

    expect(create).not.toHaveBeenCalled();
    expect(component.form.controls.name.invalid).toBe(true);
  });

  it('creates, selects and opens the workshop dashboard', () => {
    create.mockReturnValue(of({}));
    const component = TestBed.createComponent(WorkshopNewComponent).componentInstance;
    component.form.controls.name.setValue('  Racer Lab Norte  ');

    component.submit();

    expect(create).toHaveBeenCalledWith({ name: 'Racer Lab Norte' });
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.pending()).toBe(false);
  });
});
