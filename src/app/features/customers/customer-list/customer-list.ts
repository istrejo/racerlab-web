import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { CustomerPage, CustomersService } from '@core/services/customers/customers';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { catchError, distinctUntilChanged, map, of, switchMap, tap, timer } from 'rxjs';

@Component({
  selector: 'app-customer-list',
  imports: [LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-list.html',
})
export class CustomerListComponent {
  readonly permissions = inject(PermissionsService);
  private readonly customers = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<CustomerPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          search: params.get('search')?.trim() ?? '',
          page: Math.max(1, Number(params.get('page')) || 1),
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
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, page }) =>
          timer(300).pipe(
            switchMap(() => this.customers.list({ search, page, limit: 20 })),
            catchError(() => {
              this.error.set('No pudimos cargar los clientes.');
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
