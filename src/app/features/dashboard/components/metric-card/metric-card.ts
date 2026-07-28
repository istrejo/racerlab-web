import { Component, input } from '@angular/core';
import { DashboardMetric } from '../../dashboard/dashboard.mock-data';

@Component({
  selector: 'app-dashboard-metric-card',
  host: { class: 'block' },
  templateUrl: './metric-card.html',
})
export class MetricCardComponent {
  readonly metric = input.required<DashboardMetric>();
}
