import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
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
import { DEFAULT_QUOTE_CURRENCY, QuoteInput, QuoteItemInput } from '@core/models/quotes.interface';
import { QUOTE_ITEM_TYPE_LABELS, QUOTE_ITEM_TYPES } from './quote-metadata';

type EditorItem = QuoteItemInput & { costPrice: number | null };
type EditorModel = Omit<QuoteInput, 'items'> & {
  items: EditorItem[];
  discount: number | null;
  tax: number | null;
};

const emptyItem = (): EditorItem => ({
  type: 'PART',
  description: '',
  quantity: 1,
  unitPrice: 0,
  costPrice: null,
});
const round2 = (value: number): number => Math.round(value * 100) / 100;
const subtotalOf = (items: EditorItem[]): number =>
  round2(items.reduce((sum, item) => sum + round2(item.quantity * item.unitPrice), 0));

const editorSchema = schema<EditorModel>((path) => {
  required(path.currencyCode, { message: 'La moneda es obligatoria.' });
  validate(path.currencyCode, ({ value }) =>
    /^[A-Z]{3}$/.test(value().trim().toUpperCase())
      ? undefined
      : { kind: 'currency', message: 'Usa un código ISO de tres letras.' },
  );
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
    value().length ? undefined : { kind: 'emptyItems', message: 'Agrega al menos un ítem.' },
  );
});

@Component({
  selector: 'app-quote-editor',
  imports: [CurrencyPipe, FormField],
  templateUrl: './quote-editor.html',
})
export class QuoteEditorComponent {
  readonly initialValue = input<QuoteInput | null>(null);
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly submitLabel = input('Guardar borrador');
  readonly submitted = output<QuoteInput>();
  readonly cancelled = output<void>();
  readonly itemTypes = QUOTE_ITEM_TYPES;
  readonly itemTypeLabels = QUOTE_ITEM_TYPE_LABELS;
  readonly model = signal<EditorModel>({
    currencyCode: DEFAULT_QUOTE_CURRENCY,
    items: [emptyItem()],
    discount: null,
    tax: null,
  });
  readonly quoteForm = form(this.model, editorSchema);
  readonly lineTotals = computed(() =>
    this.model().items.map((item) => round2(item.quantity * item.unitPrice)),
  );
  readonly subtotal = computed(() => subtotalOf(this.model().items));
  readonly total = computed(() =>
    round2(this.subtotal() - (this.model().discount ?? 0) + (this.model().tax ?? 0)),
  );
  readonly displayCurrency = computed(
    () => this.model().currencyCode.trim().toUpperCase() || DEFAULT_QUOTE_CURRENCY,
  );
  private hydrated = false;

  constructor() {
    effect(() => {
      const value = this.initialValue();
      if (!value || this.hydrated) return;
      this.hydrated = true;
      this.model.set({
        currencyCode: value.currencyCode,
        items: value.items.map((item) => ({ ...item, costPrice: item.costPrice ?? null })),
        discount: value.discount ?? null,
        tax: value.tax ?? null,
      });
    });
  }

  addItem(): void {
    this.model.update((value) => ({ ...value, items: [...value.items, emptyItem()] }));
  }

  removeItem(index: number): void {
    this.model.update((value) => ({ ...value, items: value.items.filter((_, i) => i !== index) }));
  }

  save(event?: Event): void {
    event?.preventDefault();
    this.quoteForm().markAsTouched();
    if (this.quoteForm().invalid() || this.pending()) return;
    const value = this.model();
    this.submitted.emit({
      currencyCode: value.currencyCode.trim().toUpperCase(),
      discount: value.discount,
      tax: value.tax,
      items: value.items.map((item) => ({
        type: item.type,
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
      })),
    });
  }
}
