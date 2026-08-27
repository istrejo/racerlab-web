import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { QuotesService } from '@core/services/quotes/quotes';
import { Quote } from '@core/models/quotes.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import QuoteNewComponent from './quote-new';

describe('QuoteNewComponent', () => {
  let fixture: ComponentFixture<QuoteNewComponent>;
  const orderId = 'order-1';
  const quote = { id: 'quote-1' } as Quote;

  function createWith(quotes: Partial<QuotesService>) {
    TestBed.configureTestingModule({
      imports: [QuoteNewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ orderId }) } },
        },
        { provide: QuotesService, useValue: quotes },
      ],
    });
    fixture = TestBed.createComponent(QuoteNewComponent);
    return fixture.componentInstance;
  }

  it('starts with a single empty item and a zero subtotal/total', () => {
    const component = createWith({});

    expect(component.model().items).toHaveLength(1);
    expect(component.subtotal()).toBe(0);
    expect(component.total()).toBe(0);
  });

  it('adds and removes items', () => {
    const component = createWith({});

    component.addItem();
    expect(component.model().items).toHaveLength(2);

    component.removeItem(0);
    expect(component.model().items).toHaveLength(1);
  });

  it('computes the line and quote totals including discount and tax', () => {
    const component = createWith({});

    component.model.update((value) => ({
      ...value,
      items: [
        {
          type: 'PART',
          description: 'Filtro de aceite',
          quantity: 2,
          unitPrice: 10,
          costPrice: null,
        },
      ],
      discount: 5,
      tax: 3,
    }));

    expect(component.lineTotal(component.model().items[0])).toBe(20);
    expect(component.subtotal()).toBe(20);
    expect(component.total()).toBe(18);
  });

  it('does not save while the form is invalid', () => {
    const create = vi.fn();
    const component = createWith({ create });

    component.save();

    expect(create).not.toHaveBeenCalled();
    expect(component.quoteForm().touched()).toBe(true);
  });

  it('prevents native navigation when the quote form is submitted', () => {
    const component = createWith({ create: vi.fn() });
    fixture.detectChanges();
    const save = vi.spyOn(component, 'save');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(save).toHaveBeenCalledOnce();
  });

  it('saves a valid quote and navigates to the created quote', () => {
    const create = vi.fn(() => of(quote));
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ create });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.model.update((value) => ({
      ...value,
      items: [
        {
          type: 'PART',
          description: 'Filtro de aceite',
          quantity: 2,
          unitPrice: 10,
          costPrice: null,
        },
      ],
    }));

    component.save();

    expect(create).toHaveBeenCalledWith(orderId, {
      items: [
        {
          type: 'PART',
          description: 'Filtro de aceite',
          quantity: 2,
          unitPrice: 10,
          costPrice: null,
        },
      ],
      discount: null,
      tax: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId, 'quotes', quote.id]);
    expect(component.pending()).toBe(false);
  });

  it('shows the server error message when saving fails', () => {
    const component = createWith({
      create: () => throwError(() => ({ error: { message: 'No hay stock suficiente.' } })),
    });

    component.model.update((value) => ({
      ...value,
      items: [
        {
          type: 'PART',
          description: 'Filtro de aceite',
          quantity: 1,
          unitPrice: 10,
          costPrice: null,
        },
      ],
    }));

    component.save();

    expect(component.error()).toBe('No hay stock suficiente.');
    expect(component.pending()).toBe(false);
  });
});
