import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import {
  ServiceOrderPage,
  ServiceOrderStatus,
  ServiceOrdersService,
} from '@core/services/service-orders/service-orders';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { catchError, distinctUntilChanged, map, of, switchMap, tap, timer } from 'rxjs';

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECEIVED: 'Recibida',
  DIAGNOSIS: 'Diagnóstico',
  QUOTED: 'Cotizada',
  APPROVED: 'Aprobada',
  IN_PROGRESS: 'En progreso',
  QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Lista para entrega',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

const STATUS_ORDER: ServiceOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'QUOTED',
  'APPROVED',
  'IN_PROGRESS',
  'QUALITY_CONTROL',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

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

  readonly statuses = STATUS_ORDER;
  readonly statusLabels = STATUS_LABELS;
  readonly selectedStatus = signal<ServiceOrderStatus | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<ServiceOrderPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          search: params.get('search')?.trim() ?? '',
          status: (params.get('status') as ServiceOrderStatus | null) ?? null,
          customerId: params.get('customerId')?.trim() || null,
          vehicleId: params.get('vehicleId')?.trim() || null,
          page: Math.max(1, Number(params.get('page')) || 1),
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
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, status, customerId, vehicleId, page }) =>
          timer(300).pipe(
            switchMap(() =>
              this.serviceOrders.list({
                search,
                status: status ?? undefined,
                customerId: customerId ?? undefined,
                vehicleId: vehicleId ?? undefined,
                page,
                limit: 20,
              }),
            ),
            catchError(() => {
              this.error.set('No pudimos cargar las órdenes de servicio.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.page.set(page);
        this.loading.set(false);
      });
  }

  applySearch(): void {
    const search = this.search.value.trim();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: search || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  filterByStatus(status: ServiceOrderStatus | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  retry(): void {
    const current = this.route.snapshot.queryParamMap;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { refresh: Date.now(), page: current.get('page') ?? 1 },
      queryParamsHandling: 'merge',
    });
  }
}
