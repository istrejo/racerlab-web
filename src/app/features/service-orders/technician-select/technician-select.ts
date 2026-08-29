import { Component, input, output } from '@angular/core';
import { TechnicianSummary } from '@core/models/service-order.interface';

@Component({
  selector: 'app-technician-select',
  templateUrl: './technician-select.html',
})
export class TechnicianSelectComponent {
  readonly technicians = input<TechnicianSummary[]>([]);
  readonly selectedMembershipId = input<string | null>(null);
  readonly currentUnavailable = input<TechnicianSummary | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly disabled = input(false);
  readonly selectionChanged = output<string | null>();
  readonly retry = output<void>();

  handleSelection(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectionChanged.emit(value || null);
  }
}
