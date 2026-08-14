import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardServiceOrder } from '../../dashboard/dashboard.mock-data';

@Component({
  selector: 'app-dashboard-recent-service-orders',
  host: { class: 'block xl:col-span-2' },
  imports: [RouterLink],
  templateUrl: './recent-service-orders.html',
})
export class RecentServiceOrdersComponent {
  readonly orders = input.required<readonly DashboardServiceOrder[]>();
}
