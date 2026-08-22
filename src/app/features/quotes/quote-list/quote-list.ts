import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuotePage, QuoteStatus } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

const STATUS_ORDER: QuoteStatus[] = [
  'DRAFT',
  'ACTIVE',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
];

@Component({
  selector: 'app-quote-list',
  imports: [LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './quote-list.html',
})
export default class QuoteListComponent {
  private readonly quotes = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = STATUS_ORDER;
  readonly statusLabels = STATUS_LABELS;
  readonly selectedStatus = signal<QuoteStatus | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<QuotePage | null>(null);
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
          page: parsePositivePage(params.get('page')),
          refresh: params.get('refresh') ?? '',
        })),
        distinctUntilChanged(
          (left, right) =>
            left.search === right.search &&
            left.status === right.status &&
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
        switchMap(({ search, status, page }) =>
          this.quotes
            .listForWorkshop({
              search,
              status: status ?? undefined,
              page,
              limit: 20,
            })
            .pipe(
              catchError(() => {
                this.error.set('No pudimos cargar las cotizaciones.');
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

  filterByStatus(status: QuoteStatus | null): void {
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

  private parseStatus(value: string | null): QuoteStatus | null {
    return STATUS_ORDER.includes(value as QuoteStatus) ? (value as QuoteStatus) : null;
  }
}
