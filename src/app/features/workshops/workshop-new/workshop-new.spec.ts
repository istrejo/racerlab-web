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

  beforeEach(async () => {
    create.mockReset();
    logout.mockReset();
    await TestBed.configureTestingModule({
      imports: [WorkshopNewComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasActiveWorkshop: () => false,
            defaultAuthenticatedRoute: () => '/dashboard',
            logout,
          },
        },
        { provide: WorkshopsService, useValue: { create } },
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
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    create.mockReturnValue(of({}));
    const component = TestBed.createComponent(WorkshopNewComponent).componentInstance;
    component.form.controls.name.setValue('  Racer Lab Norte  ');

    component.submit();

    expect(create).toHaveBeenCalledWith({ name: 'Racer Lab Norte' });
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.pending()).toBe(false);
  });
});
