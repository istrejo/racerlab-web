import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehicleWithCustomerPage } from '@core/models/vehicle.interface';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-vehicle-workshop-list',
  imports: [LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-workshop-list.html',
})
export default class VehicleWorkshopListComponent {
  private readonly vehicles = inject(VehiclesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<VehicleWithCustomerPage | null>(null);
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
          this.vehicles.listForWorkshop({ search, page, limit: 20 }).pipe(
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

  private updateQuery(queryParams: Record<string, unknown>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
