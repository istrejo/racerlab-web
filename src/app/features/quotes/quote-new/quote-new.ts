import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuoteInput } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { QuoteEditorComponent } from '../quote-editor/quote-editor';

@Component({
  selector: 'app-quote-new',
  imports: [QuoteEditorComponent, RouterLink],
  templateUrl: './quote-new.html',
})
export default class QuoteNewComponent {
  private readonly quotes = inject(QuotesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  save(input: QuoteInput): void {
    this.pending.set(true);
    this.error.set(null);
    this.quotes.create(this.orderId, input).subscribe({
      next: (quote) =>
        void this.router.navigate(['/service-orders', this.orderId, 'quotes', quote.id]),
      error: (error: { error?: { message?: string } }) => {
        this.pending.set(false);
        this.error.set(error?.error?.message ?? 'No pudimos guardar la cotización.');
      },
      complete: () => this.pending.set(false),
    });
  }

  cancel(): void {
    void this.router.navigate(['/service-orders', this.orderId]);
  }
}
