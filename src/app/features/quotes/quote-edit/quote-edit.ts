import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Quote, QuoteInput } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { QuoteEditorComponent } from '../quote-editor/quote-editor';

const toQuoteInput = (quote: Quote): QuoteInput => ({
  currencyCode: quote.currencyCode,
  items: quote.items.map((item) => ({
    type: item.type,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
  })),
  discount: quote.discount,
  tax: quote.tax,
});

@Component({
  selector: 'app-quote-edit',
  imports: [LoadingSkeletonComponent, QuoteEditorComponent, RouterLink],
  templateUrl: './quote-edit.html',
})
export default class QuoteEditComponent {
  private readonly quotes = inject(QuotesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly quoteId = this.route.snapshot.paramMap.get('quoteId') ?? '';

  private readonly draft = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly initialValue = computed(() => {
    const quote = this.draft();
    return quote ? toQuoteInput(quote) : null;
  });

  constructor() {
    this.quotes.get(this.orderId, this.quoteId).subscribe({
      next: (quote) => {
        if (quote.status !== 'DRAFT') {
          this.error.set('Solo se pueden editar borradores.');
          return;
        }
        this.draft.set(quote);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar la cotización.');
      },
      complete: () => this.loading.set(false),
    });
  }

  save(input: QuoteInput): void {
    this.pending.set(true);
    this.error.set(null);
    this.quotes.update(this.orderId, this.quoteId, input).subscribe({
      next: () => void this.router.navigate(this.detailCommands()),
      error: (error: { status?: number }) => {
        this.pending.set(false);
        this.error.set(
          error.status === 409
            ? 'La cotización ya no es un borrador editable.'
            : 'No pudimos guardar los cambios.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }

  cancel(): void {
    void this.router.navigate(this.detailCommands());
  }

  private detailCommands(): unknown[] {
    return ['/service-orders', this.orderId, 'quotes', this.quoteId];
  }
}
