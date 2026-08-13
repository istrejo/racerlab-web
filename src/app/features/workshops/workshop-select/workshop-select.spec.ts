import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { WorkshopsService, WorkshopSummary } from '@core/services/workshops/workshops';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkshopSelectComponent } from './workshop-select';

describe('WorkshopSelectComponent', () => {
  let fixture: ComponentFixture<WorkshopSelectComponent>;
  let component: WorkshopSelectComponent;
  let availableWorkshops: WorkshopSummary[];
  const list = vi.fn(() => of(availableWorkshops));
  const select = vi.fn(() => of(undefined));
  const currentWorkshop = { workshopId: 'current-id' };

  beforeEach(async () => {
    availableWorkshops = [];
    list.mockClear();
    select.mockClear();
    await TestBed.configureTestingModule({
      imports: [WorkshopSelectComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            activeWorkshop: () => currentWorkshop,
            hasActiveWorkshop: () => true,
          },
        },
        {
          provide: WorkshopsService,
          useValue: { list, select },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopSelectComponent);
    component = fixture.componentInstance;
  });

  it('shows available workshops and marks the current one', () => {
    availableWorkshops = [
      {
        id: 'current-id',
        name: 'Racer Lab Central',
        ownerUserId: 'owner-id',
        membershipId: 'membership-id',
        role: 'OWNER',
      },
    ];
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'li button',
    );
    expect(button?.textContent).toContain('Racer Lab Central');
    expect(button?.getAttribute('aria-current')).toBe('true');
  });

  it('selects another workshop and returns to the dashboard', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const workshop = {
      id: 'other-id',
      name: 'Racer Lab Sur',
      ownerUserId: 'owner-id',
      membershipId: 'other-membership',
      role: 'ADMIN' as const,
    };

    component.select(workshop);

    expect(select).toHaveBeenCalledWith('other-id');
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows a retry action after a loading failure', () => {
    const workshops = TestBed.inject(WorkshopsService);
    vi.spyOn(workshops, 'list').mockReturnValueOnce(
      throwError(() => new Error('service unavailable')),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tus talleres');
    expect(fixture.nativeElement.querySelector('button')?.textContent).toContain('Reintentar');
  });
});
