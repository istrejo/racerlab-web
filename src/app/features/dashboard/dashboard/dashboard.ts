import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ServiceOrder } from '@core/models/service-order.interface';
import { PermissionsService } from '@core/services/permissions/permissions';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { catchError, of, startWith, Subject, switchMap, tap } from 'rxjs';
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
    RouterLink,
    TechnicianWorkloadComponent,
  ],
  templateUrl: './dashboard.html',
})
export default class DashboardComponent {
  readonly permissions = inject(PermissionsService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersRefresh = new Subject<void>();

  readonly dashboard = signal(DASHBOARD_MOCK_DATA);
  readonly recentOrders = signal<readonly ServiceOrder[]>([]);
  readonly recentOrdersLoading = signal(false);
  readonly recentOrdersError = signal<string | null>(null);
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

  constructor() {
    if (!this.permissions.canReadOrders()) return;

    this.ordersRefresh
      .pipe(
        startWith(undefined),
        tap(() => {
          this.recentOrdersLoading.set(true);
          this.recentOrdersError.set(null);
        }),
        switchMap(() =>
          this.serviceOrders.list({ page: 1, limit: 10 }).pipe(
            catchError(() => {
              this.recentOrdersError.set('No pudimos cargar las órdenes recientes.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (page) this.recentOrders.set(page.items);
        this.recentOrdersLoading.set(false);
      });
  }

  retryRecentOrders(): void {
    if (this.permissions.canReadOrders()) this.ordersRefresh.next();
  }
}
