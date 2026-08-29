import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TechnicianSelectComponent } from './technician-select';

it('renders and emits technician membership selections', () => {
  TestBed.configureTestingModule({ imports: [TechnicianSelectComponent] });
  const fixture = TestBed.createComponent(TechnicianSelectComponent);
  const technician = { membershipId: 'm1', userId: 'u1', displayName: 'Ana' };
  fixture.componentRef.setInput('technicians', [technician]);
  const selected = vi.fn();
  fixture.componentInstance.selectionChanged.subscribe(selected);
  fixture.detectChanges();

  const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  select.value = technician.membershipId;
  select.dispatchEvent(new Event('change'));
  expect(selected).toHaveBeenCalledWith(technician.membershipId);
});
