import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuotePage, QuoteStatus } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { parsePositivePage } from '@shared/utils/route-query';
import {
  QUOTE_STATUS_FILTERS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  quoteVersionLabel,
} from '../quote-policy';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-quote-list',
  imports: [CurrencyPipe, LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './quote-list.html',
})
export default class QuoteListComponent {
  private readonly quotes = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = QUOTE_STATUS_FILTERS;
  readonly statusLabels = QUOTE_STATUS_LABELS;
  readonly statusTones = QUOTE_STATUS_TONES;
  readonly selectedStatus = signal<QuoteStatus | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<QuotePage | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  readonly rows = computed(() =>
    (this.page()?.items ?? []).map((quote) => ({
      quote,
      versionLabel: quoteVersionLabel(quote.version),
      statusLabel: QUOTE_STATUS_LABELS[quote.status],
      statusTone: QUOTE_STATUS_TONES[quote.status],
    })),
  );

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

  applySearch(event?: Event): void {
    event?.preventDefault();
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
    return QUOTE_STATUS_FILTERS.includes(value as QuoteStatus) ? (value as QuoteStatus) : null;
  }
}
