import { Component, computed, signal } from '@angular/core';
import { AttentionListComponent } from '../components/attention-list/attention-list';
import type { DashboardAttentionListItem } from '../components/attention-list/attention-list';
import { MetricCardComponent } from '../components/metric-card/metric-card';
import { RecentServiceOrdersComponent } from '../components/recent-service-orders/recent-service-orders';
import { TechnicianWorkloadComponent } from '../components/technician-workload/technician-workload';
import { DASHBOARD_MOCK_DATA } from './dashboard.mock-data';

@Component({
  selector: 'app-dashboard',
  imports: [
    AttentionListComponent,
    MetricCardComponent,
    RecentServiceOrdersComponent,
    TechnicianWorkloadComponent,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  readonly dashboard = signal(DASHBOARD_MOCK_DATA);
  readonly pendingQuoteItems = computed<readonly DashboardAttentionListItem[]>(() =>
    this.dashboard().pendingQuotes.map((quote) => ({
      id: quote.id,
      primary: quote.customer,
      secondary: `${quote.id} - ${quote.vehicle}`,
      value: quote.amount,
      detail: quote.waitingSince,
    })),
  );
  readonly lowStockItems = computed<readonly DashboardAttentionListItem[]>(() =>
    this.dashboard().lowStockItems.map((item) => ({
      id: item.id,
      primary: item.name,
      secondary: `Minimum: ${item.minimum} ${item.unit}`,
      value: `${item.available} ${item.unit}`,
      detail: 'available',
    })),
  );
}
