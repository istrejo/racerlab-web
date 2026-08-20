import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardTechnician } from '../../dashboard/dashboard.mock-data';
import { TechnicianWorkloadComponent } from './technician-workload';

describe('TechnicianWorkloadComponent', () => {
  let fixture: ComponentFixture<TechnicianWorkloadComponent>;

  const technicians: DashboardTechnician[] = [
    {
      id: 'dave-r',
      name: 'Dave R.',
      active: 3,
      pending: 1,
      activePercent: 60,
      pendingPercent: 20,
      tone: 'primary',
    },
    {
      id: 'chris-b',
      name: 'Chris B.',
      active: 0,
      pending: 0,
      activePercent: 0,
      pendingPercent: 0,
      tone: 'primary',
    },
  ];

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicianWorkloadComponent);
    fixture.componentRef.setInput('technicians', technicians);
    fixture.detectChanges();
  });

  it('renders one row per technician with the active/pending counts', () => {
    const fixtureElement: HTMLElement = fixture.nativeElement;
    expect(fixtureElement.textContent).toContain('Dave R.');
    expect(fixtureElement.textContent).toContain('3 active / 1 pending');
  });

  it('shows the available label when a technician has no active or pending work', () => {
    expect(fixture.nativeElement.textContent).toContain('Available');
  });

  it('sets accessible progressbar attributes per technician', () => {
    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="progressbar"]');
    expect(bars.length).toBe(2);
    expect(bars[0].getAttribute('aria-label')).toBe('Dave R. workload');
    expect(bars[0].getAttribute('aria-valuenow')).toBe('80');
  });
});
