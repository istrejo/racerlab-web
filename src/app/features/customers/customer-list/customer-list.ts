import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer, CustomerPage, CustomerSort } from '@core/models/customer.interface';
import { CustomersService } from '@core/services/customers/customers';
import { PermissionsService } from '@core/services/permissions/permissions';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { CustomerCreateDialogComponent } from '../customer-create-dialog/customer-create-dialog';

type PresenceFilter = 'all' | 'true' | 'false';

const CUSTOMER_SORTS: CustomerSort[] = ['NAME_ASC', 'NAME_DESC', 'NEWEST', 'OLDEST'];

@Component({
  selector: 'app-customer-list',
  imports: [
    CustomerCreateDialogComponent,
    LoadingSkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './customer-list.html',
})
export default class CustomerListComponent {
  readonly permissions = inject(PermissionsService);
  private readonly customers = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly hasVehicles = new FormControl<PresenceFilter>('all', { nonNullable: true });
  readonly hasServiceOrders = new FormControl<PresenceFilter>('all', { nonNullable: true });
  readonly sort = new FormControl<CustomerSort>('NAME_ASC', { nonNullable: true });
  readonly page = signal<CustomerPage | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtersOpen = signal(false);
  readonly customerDialogOpen = signal(false);

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
          hasVehicles: this.parsePresence(params.get('hasVehicles')),
          hasServiceOrders: this.parsePresence(params.get('hasServiceOrders')),
          sort: this.parseSort(params.get('sort')),
          page: parsePositivePage(params.get('page')),
          refresh: params.get('refresh') ?? '',
        })),
        distinctUntilChanged(
          (left, right) =>
            left.search === right.search &&
            left.hasVehicles === right.hasVehicles &&
            left.hasServiceOrders === right.hasServiceOrders &&
            left.sort === right.sort &&
            left.page === right.page &&
            left.refresh === right.refresh,
        ),
        tap((query) => {
          this.search.setValue(query.search, { emitEvent: false });
          this.hasVehicles.setValue(this.toPresenceControl(query.hasVehicles), {
            emitEvent: false,
          });
          this.hasServiceOrders.setValue(this.toPresenceControl(query.hasServiceOrders), {
            emitEvent: false,
          });
          this.sort.setValue(query.sort, { emitEvent: false });
          if (this.page()) this.refreshing.set(true);
          else this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, hasVehicles, hasServiceOrders, sort, page }) =>
          this.customers
            .list({ search, hasVehicles, hasServiceOrders, sort, page, limit: 20 })
            .pipe(
              catchError(() => {
                this.error.set('No pudimos cargar los clientes.');
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
    this.updateQuery({ search: this.search.value.trim() || null, page: 1 });
  }

  applyFilters(): void {
    this.updateQuery({
      hasVehicles: this.fromPresenceControl(this.hasVehicles.value),
      hasServiceOrders: this.fromPresenceControl(this.hasServiceOrders.value),
      sort: this.sort.value === 'NAME_ASC' ? null : this.sort.value,
      page: 1,
    });
  }

  clearFilters(): void {
    this.hasVehicles.setValue('all', { emitEvent: false });
    this.hasServiceOrders.setValue('all', { emitEvent: false });
    this.sort.setValue('NAME_ASC', { emitEvent: false });
    this.updateQuery({ hasVehicles: null, hasServiceOrders: null, sort: null, page: 1 });
  }

  goToPage(page: number): void {
    this.updateQuery({ page });
  }

  retry(): void {
    this.updateQuery({ refresh: Date.now() });
  }

  customerCreated(_customer: Customer): void {
    this.customerDialogOpen.set(false);
    this.retry();
  }

  initials(fullName: string): string {
    return fullName
      .split(/\s+/)
      .filter((part) => !!part)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  pageSummary(result: CustomerPage): string {
    if (result.total === 0) return '0 clientes';
    const start = (result.page - 1) * result.limit + 1;
    const end = Math.min(result.page * result.limit, result.total);
    return `Mostrando ${start} - ${end} de ${result.total} clientes`;
  }

  private updateQuery(queryParams: Record<string, unknown>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parsePresence(value: string | null): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private parseSort(value: string | null): CustomerSort {
    return CUSTOMER_SORTS.includes(value as CustomerSort) ? (value as CustomerSort) : 'NAME_ASC';
  }

  private toPresenceControl(value: boolean | undefined): PresenceFilter {
    return value === undefined ? 'all' : (String(value) as PresenceFilter);
  }

  private fromPresenceControl(value: PresenceFilter): boolean | null {
    return value === 'all' ? null : value === 'true';
  }
}
