import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceOrderPage, ServiceOrderStatus } from '@core/models/service-order.interface';
import {
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STATUS_ORDER,
  SERVICE_ORDER_STATUS_TONES,
} from '@core/models/service-order-status';
import { PermissionsService } from '@core/services/permissions/permissions';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-service-order-list',
  imports: [LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './service-order-list.html',
})
export default class ServiceOrderListComponent {
  readonly permissions = inject(PermissionsService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = SERVICE_ORDER_STATUS_ORDER;
  readonly statusLabels = SERVICE_ORDER_STATUS_LABELS;
  readonly statusTones = SERVICE_ORDER_STATUS_TONES;
  readonly selectedStatus = signal<ServiceOrderStatus | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<ServiceOrderPage | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => this.updateQuery({ search: search || null, page: 1 }));

    this.route.queryParamMap
      .pipe(
        map((params) => ({
          search: params.get('search')?.trim() ?? '',
          status: this.parseStatus(params.get('status')),
          customerId: params.get('customerId')?.trim() || null,
          vehicleId: params.get('vehicleId')?.trim() || null,
          page: parsePositivePage(params.get('page')),
          refresh: params.get('refresh') ?? '',
        })),
        distinctUntilChanged(
          (left, right) =>
            left.search === right.search &&
            left.status === right.status &&
            left.customerId === right.customerId &&
            left.vehicleId === right.vehicleId &&
            left.page === right.page &&
            left.refresh === right.refresh,
        ),
        tap((query) => {
          this.search.setValue(query.search, { emitEvent: false });
          this.selectedStatus.set(query.status);
          if (this.page()) this.refreshing.set(true);
          else this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, status, customerId, vehicleId, page }) =>
          this.serviceOrders
            .list({
              search,
              status: status ?? undefined,
              customerId: customerId ?? undefined,
              vehicleId: vehicleId ?? undefined,
              page,
              limit: 20,
            })
            .pipe(
              catchError(() => {
                this.error.set('No pudimos cargar las órdenes de servicio.');
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (page) this.page.set(page);
        this.loading.set(false);
        this.refreshing.set(false);
      });
  }

  applySearch(event?: Event): void {
    event?.preventDefault();
    const search = this.search.value.trim();
    this.updateQuery({ search: search || null, page: 1 });
  }

  filterByStatus(status: ServiceOrderStatus | null): void {
    this.updateQuery({ status: status || null, page: 1 });
  }

  goToPage(page: number): void {
    this.updateQuery({ page });
  }

  retry(): void {
    this.updateQuery({ refresh: Date.now() });
  }

  private updateQuery(queryParams: Record<string, unknown>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseStatus(value: string | null): ServiceOrderStatus | null {
    return SERVICE_ORDER_STATUS_ORDER.includes(value as ServiceOrderStatus)
      ? (value as ServiceOrderStatus)
      : null;
  }
}
