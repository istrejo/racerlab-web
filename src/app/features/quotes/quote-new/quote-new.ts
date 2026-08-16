import { Component, computed, inject, signal } from '@angular/core';
import {
  applyEach,
  form,
  FormField,
  max,
  maxLength,
  min,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuoteItemType, QuotesService } from '@core/services/quotes/quotes';

type QuoteItemModel = {
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice: number | null;
};

type QuoteModel = {
  items: QuoteItemModel[];
  discount: number | null;
  tax: number | null;
};

const ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  PART: 'Repuesto',
  LABOR: 'Mano de obra',
  SERVICE: 'Servicio',
  OTHER: 'Otro',
};

const ITEM_TYPES: QuoteItemType[] = ['PART', 'LABOR', 'SERVICE', 'OTHER'];

const emptyItem = (): QuoteItemModel => ({
  type: 'PART',
  description: '',
  quantity: 1,
  unitPrice: 0,
  costPrice: null,
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

const subtotalOf = (items: QuoteItemModel[]): number =>
  round2(
    items.reduce((acc, item) => acc + round2((item.quantity || 0) * (item.unitPrice || 0)), 0),
  );

const quoteSchema = schema<QuoteModel>((path) => {
  applyEach(path.items, (item) => {
    required(item.description, { message: 'La descripción es obligatoria.' });
    maxLength(item.description, 500);
    min(item.quantity, 0.01, { message: 'La cantidad debe ser mayor que cero.' });
    min(item.unitPrice, 0, { message: 'El precio no puede ser negativo.' });
  });

  min(path.discount, 0, { message: 'El descuento no puede ser negativo.' });
  min(path.tax, 0, { message: 'El impuesto no puede ser negativo.' });
  max(path.discount, ({ valueOf }) => subtotalOf(valueOf(path.items)), {
    message: 'El descuento no puede superar el subtotal.',
  });
  validate(path.items, ({ value }) =>
    value().length === 0 ? { kind: 'emptyItems', message: 'Agrega al menos un ítem.' } : undefined,
  );
});

@Component({
  selector: 'app-quote-new',
  imports: [FormField, RouterLink],
  templateUrl: './quote-new.html',
})
export default class QuoteNewComponent {
  private readonly quotes = inject(QuotesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';

  readonly itemTypes = ITEM_TYPES;
  readonly itemTypeLabels = ITEM_TYPE_LABELS;

  readonly model = signal<QuoteModel>({ items: [emptyItem()], discount: null, tax: null });
  readonly quoteForm = form(this.model, quoteSchema);

  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  readonly subtotal = computed(() => subtotalOf(this.model().items));
  readonly total = computed(() =>
    round2(this.subtotal() - (this.model().discount ?? 0) + (this.model().tax ?? 0)),
  );

  lineTotal(item: QuoteItemModel): number {
    return round2((item.quantity || 0) * (item.unitPrice || 0));
  }

  addItem(): void {
    this.model.update((value) => ({ ...value, items: [...value.items, emptyItem()] }));
  }

  removeItem(index: number): void {
    this.model.update((value) => ({
      ...value,
      items: value.items.filter((_, position) => position !== index),
    }));
  }

  save(): void {
    this.quoteForm().markAsTouched();
    if (this.quoteForm().invalid() || this.pending()) {
      return;
    }

    const value = this.model();
    this.pending.set(true);
    this.error.set(null);

    this.quotes
      .create(this.orderId, {
        items: value.items.map((item) => ({
          type: item.type,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          costPrice: item.costPrice === null ? null : Number(item.costPrice),
        })),
        discount: value.discount,
        tax: value.tax,
      })
      .subscribe({
        next: (quote) => {
          this.pending.set(false);
          void this.router.navigate(['/service-orders', this.orderId, 'quotes', quote.id]);
        },
        error: (err: { error?: { message?: string } }) => {
          this.pending.set(false);
          this.error.set(err?.error?.message ?? 'No pudimos guardar la cotización.');
        },
      });
  }
}
