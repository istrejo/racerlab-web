import { Component, input } from '@angular/core';
import { DashboardServiceOrder } from '../../dashboard/dashboard.mock-data';

@Component({
  selector: 'app-dashboard-recent-service-orders',
  host: { class: 'block xl:col-span-2' },
  templateUrl: './recent-service-orders.html',
})
export class RecentServiceOrdersComponent {
  readonly orders = input.required<readonly DashboardServiceOrder[]>();
}
