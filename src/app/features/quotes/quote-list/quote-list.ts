import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuotePage, QuoteStatus, QuotesService } from '@core/services/quotes/quotes';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { catchError, distinctUntilChanged, map, of, switchMap, tap, timer } from 'rxjs';

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
export class QuoteListComponent {
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
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          search: params.get('search')?.trim() ?? '',
          status: (params.get('status') as QuoteStatus | null) ?? null,
          page: Math.max(1, Number(params.get('page')) || 1),
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
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ search, status, page }) =>
          timer(300).pipe(
            switchMap(() =>
              this.quotes.listForWorkshop({
                search,
                status: status ?? undefined,
                page,
                limit: 20,
              }),
            ),
            catchError(() => {
              this.error.set('No pudimos cargar las cotizaciones.');
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

  filterByStatus(status: QuoteStatus | null): void {
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
