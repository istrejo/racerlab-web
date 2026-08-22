import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WorkshopSummary } from '@core/models/workshop.interface';
import { AuthService } from '@core/services/auth/auth';
import { WorkshopsService } from '@core/services/workshops/workshops';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkshopSwitchDialogComponent } from './workshop-switch-dialog';

describe('WorkshopSwitchDialogComponent', () => {
  const current: WorkshopSummary = {
    id: 'workshop-1',
    name: 'Taller Norte',
    ownerUserId: 'user-1',
    membershipId: 'membership-1',
    role: 'OWNER',
  };
  const target: WorkshopSummary = {
    ...current,
    id: 'workshop-2',
    name: 'Taller Sur',
    membershipId: 'membership-2',
  };

  function create(overrides: { list?: unknown; select?: unknown } = {}) {
    const list = overrides.list ?? vi.fn(() => of([current, target]));
    const select = overrides.select ?? vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [WorkshopSwitchDialogComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { activeWorkshop: signal({ workshopId: current.id }) },
        },
        { provide: WorkshopsService, useValue: { list, select } },
      ],
    });
    const fixture = TestBed.createComponent(WorkshopSwitchDialogComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, list, select };
  }

  it('lists workshops, marks the current one and switches to another', () => {
    const { component, select } = create();
    const switched = vi.fn();
    component.switched.subscribe(switched);

    component.select(current);
    expect(select).not.toHaveBeenCalled();

    component.select(target);
    expect(select).toHaveBeenCalledWith(target.id);
    expect(switched).toHaveBeenCalledOnce();
  });

  it('blocks duplicate selection while the request is pending', () => {
    const request = new Subject<unknown>();
    const select = vi.fn(() => request.asObservable());
    const { component } = create({ select });

    component.select(target);
    component.select(target);

    expect(select).toHaveBeenCalledOnce();
    expect(component.selectingId()).toBe(target.id);
  });

  it('shows load and selection errors in the modal', () => {
    const { component } = create({
      list: vi.fn(() => throwError(() => new Error('load failed'))),
    });
    expect(component.error()).toContain('cargar tus talleres');

    const select = vi.fn(() => throwError(() => new Error('select failed')));
    TestBed.resetTestingModule();
    const second = create({ select }).component;
    second.select(target);
    expect(second.error()).toContain('cambiar de taller');
  });
});
