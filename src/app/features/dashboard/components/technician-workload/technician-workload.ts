import { Component, input } from '@angular/core';
import { DashboardTechnician } from '../../dashboard/dashboard.mock-data';

@Component({
  selector: 'app-dashboard-technician-workload',
  host: { class: 'block' },
  templateUrl: './technician-workload.html',
})
export class TechnicianWorkloadComponent {
  readonly technicians = input.required<readonly DashboardTechnician[]>();
}
