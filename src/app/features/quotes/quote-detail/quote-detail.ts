import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChangeQuoteStatusInput, Quote, QuoteApprovalMethod } from '@core/models/quotes.interface';
import { PermissionsService } from '@core/services/permissions/permissions';
import { QuotesService } from '@core/services/quotes/quotes';
import { AppModalComponent } from '@shared/components/app-modal/app-modal';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import {
  QUOTE_APPROVAL_METHODS,
  QUOTE_APPROVAL_METHOD_LABELS,
  QUOTE_ITEM_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  QuoteAction,
  QuoteActionKind,
  quoteActionsFor,
  quoteVersionLabel,
} from '../quote-policy';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-quote-detail',
  imports: [AppModalComponent, CurrencyPipe, DatePipe, LoadingSkeletonComponent, RouterLink],
  templateUrl: './quote-detail.html',
})
export default class QuoteDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly quotes = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly quoteId = this.route.snapshot.paramMap.get('quoteId') ?? '';

  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeAction = signal<QuoteAction | null>(null);
  readonly actionPending = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly approvalMethod = signal<QuoteApprovalMethod | ''>('');
  readonly approvalMethodDetail = signal('');

  readonly statusLabels = QUOTE_STATUS_LABELS;
  readonly statusTones = QUOTE_STATUS_TONES;
  readonly itemTypeLabels = QUOTE_ITEM_TYPE_LABELS;
  readonly approvalMethods = QUOTE_APPROVAL_METHODS;
  readonly approvalMethodLabels = QUOTE_APPROVAL_METHOD_LABELS;

  readonly versionLabel = computed(() => {
    const quote = this.quote();
    return quote ? quoteVersionLabel(quote.version) : '';
  });

  readonly actions = computed(() => {
    const quote = this.quote();
    if (!quote) return [];
    return quoteActionsFor(quote.status, this.permissions.canWriteQuotes());
  });

  readonly modalOpen = computed(() => this.activeAction() !== null);
  readonly modalTitle = computed(() => this.activeAction()?.modalTitle ?? '');
  readonly modalDescription = computed(() => this.activeAction()?.modalDescription ?? '');
  readonly confirmLabel = computed(() => this.activeAction()?.confirmLabel ?? '');
  readonly methodRequired = computed(() => this.activeAction()?.requiresMethod ?? false);
  readonly detailRequired = computed(
    () => this.methodRequired() && this.approvalMethod() === 'OTHER',
  );

  readonly canConfirm = computed(() => {
    if (this.actionPending()) return false;
    if (!this.methodRequired()) return true;
    if (this.approvalMethod() === '') return false;
    return !this.detailRequired() || this.approvalMethodDetail().trim().length > 0;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.quotes
      .get(this.orderId, this.quoteId)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar la cotización.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quote) => {
        this.quote.set(quote);
        this.loading.set(false);
      });
  }

  runAction(kind: QuoteActionKind): void {
    const action = this.actions().find((candidate) => candidate.kind === kind);
    if (!action || this.actionPending()) return;

    if (action.kind === 'edit') {
      void this.router.navigate(['/service-orders', this.orderId, 'quotes', this.quoteId, 'edit']);
      return;
    }

    this.approvalMethod.set('');
    this.approvalMethodDetail.set('');
    this.actionError.set(null);
    this.activeAction.set(action);
  }

  dismissAction(): void {
    if (this.actionPending()) return;
    this.activeAction.set(null);
    this.actionError.set(null);
  }

  selectMethod(value: string): void {
    this.approvalMethod.set(value as QuoteApprovalMethod | '');
  }

  updateMethodDetail(value: string): void {
    this.approvalMethodDetail.set(value);
  }

  confirmAction(): void {
    const action = this.activeAction();
    if (!action || !this.canConfirm()) return;

    this.actionPending.set(true);
    this.actionError.set(null);

    const request =
      action.kind === 'version'
        ? this.quotes.createVersion(this.orderId, this.quoteId)
        : this.quotes.changeStatus(this.orderId, this.quoteId, this.decisionPayload(action));

    this.submit(request, action);
  }

  private decisionPayload(action: QuoteAction): ChangeQuoteStatusInput {
    const payload: ChangeQuoteStatusInput = {
      status: action.status as NonNullable<QuoteAction['status']>,
    };

    if (!action.requiresMethod) return payload;

    const method = this.approvalMethod() as QuoteApprovalMethod;
    payload.approvalMethod = method;
    if (method === 'OTHER') payload.approvalMethodDetail = this.approvalMethodDetail().trim();

    return payload;
  }

  private submit(request: Observable<Quote>, action: QuoteAction): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (quote) => {
        this.actionPending.set(false);
        this.activeAction.set(null);

        if (action.kind === 'version') {
          void this.router.navigate(['/service-orders', this.orderId, 'quotes', quote.id, 'edit']);
          return;
        }

        this.quote.set(quote);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionPending.set(false);
        this.actionError.set(err?.error?.message ?? 'No pudimos completar la acción.');
      },
    });
  }
}
