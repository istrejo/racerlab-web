import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Vehicle, VehiclePage } from '@core/models/vehicle.interface';
import { PermissionsService } from '@core/services/permissions/permissions';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import { VehicleCreateDialogComponent } from '../vehicle-create-dialog/vehicle-create-dialog';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-vehicle-list',
  imports: [
    LoadingSkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    VehicleCreateDialogComponent,
  ],
  templateUrl: './vehicle-list.html',
})
export default class VehicleListComponent {
  readonly permissions = inject(PermissionsService);
  private readonly vehicles = inject(VehiclesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly customerId = this.route.snapshot.paramMap.get('customerId') ?? '';
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<VehiclePage | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly vehicleDialogOpen = signal(false);

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
          page: parsePositivePage(params.get('page')),
          refresh: params.get('refresh') ?? '',
        })),
        distinctUntilChanged(
          (left, right) =>
            left.search === right.search &&
            left.page === right.page &&
            left.refresh === right.refresh,
        ),
        tap((query) => {
          this.search.setValue(query.search, { emitEvent: false });
          if (this.page()) this.refreshing.set(true);
          else this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, page }) =>
          this.vehicles.list(this.customerId, { search, page, limit: 20 }).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar los vehículos.');
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

  applySearch(): void {
    const search = this.search.value.trim();
    this.updateQuery({ search: search || null, page: 1 });
  }

  goToPage(page: number): void {
    this.updateQuery({ page });
  }

  retry(): void {
    this.updateQuery({ refresh: Date.now() });
  }

  vehicleCreated(_vehicle: Vehicle): void {
    this.vehicleDialogOpen.set(false);
    this.retry();
  }

  private updateQuery(queryParams: Record<string, unknown>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
