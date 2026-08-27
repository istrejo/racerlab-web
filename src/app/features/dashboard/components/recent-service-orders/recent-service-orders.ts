import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOrder } from '@core/models/service-order.interface';
import {
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STATUS_TONES,
} from '@core/models/service-order-status';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-dashboard-recent-service-orders',
  host: { class: 'block xl:col-span-2' },
  imports: [DatePipe, LoadingSkeletonComponent, RouterLink],
  templateUrl: './recent-service-orders.html',
})
export class RecentServiceOrdersComponent {
  readonly orders = input.required<readonly ServiceOrder[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();

  readonly statusLabels = SERVICE_ORDER_STATUS_LABELS;
  readonly statusTones = SERVICE_ORDER_STATUS_TONES;

  reportedIssue(order: ServiceOrder): string {
    return order.reportedIssues?.trim() || 'Sin detalle de recepción';
  }
}
