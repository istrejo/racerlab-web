import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { Quote, QuoteItemType, QuoteStatus, QuotesService } from '@core/services/quotes/quotes';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { catchError, of } from 'rxjs';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

const ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  PART: 'Repuesto',
  LABOR: 'Mano de obra',
  SERVICE: 'Servicio',
  OTHER: 'Otro',
};

const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

const METHOD_REQUIRED: QuoteStatus[] = ['APPROVED', 'REJECTED'];

@Component({
  selector: 'app-quote-detail',
  imports: [DatePipe, LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './quote-detail.html',
})
export class QuoteDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly quotes = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly quoteId = this.route.snapshot.paramMap.get('quoteId') ?? '';

  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dialogOpen = signal(false);
  readonly actionPending = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly statusLabels = STATUS_LABELS;
  readonly itemTypeLabels = ITEM_TYPE_LABELS;

  readonly statusForm = new FormGroup({
    status: new FormControl<QuoteStatus | null>(null, { validators: Validators.required }),
    approvalMethod: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(120),
    }),
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

  allowedNextStatuses(current: QuoteStatus): QuoteStatus[] {
    return ALLOWED_TRANSITIONS[current] ?? [];
  }

  requiresMethod(status: QuoteStatus | null): boolean {
    return status !== null && METHOD_REQUIRED.includes(status);
  }

  openStatusDialog(): void {
    this.dialogOpen.set(true);
    this.statusForm.reset({ status: null, approvalMethod: '' });
    this.actionError.set(null);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.actionError.set(null);
  }

  changeStatus(): void {
    this.statusForm.markAllAsTouched();
    const value = this.statusForm.getRawValue();
    const status = value.status;

    if (this.statusForm.invalid || status === null || this.actionPending()) {
      return;
    }

    const approvalMethod = value.approvalMethod.trim();
    if (this.requiresMethod(status) && !approvalMethod) {
      this.actionError.set('Indica el método de aprobación o rechazo.');
      return;
    }

    this.actionPending.set(true);
    this.actionError.set(null);

    this.quotes
      .changeStatus(this.orderId, this.quoteId, {
        status,
        approvalMethod: approvalMethod || null,
      })
      .subscribe({
        next: (quote) => {
          this.quote.set(quote);
          this.actionPending.set(false);
          this.closeDialog();
        },
        error: (err: { error?: { message?: string } }) => {
          this.actionPending.set(false);
          this.actionError.set(err?.error?.message ?? 'No pudimos cambiar el estado.');
        },
      });
  }
}
