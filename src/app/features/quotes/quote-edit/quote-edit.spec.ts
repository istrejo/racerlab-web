import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Quote, QuoteInput, QuoteStatus } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import QuoteEditComponent from './quote-edit';

describe('QuoteEditComponent', () => {
  let fixture: ComponentFixture<QuoteEditComponent>;
  const orderId = 'order-1';
  const quoteId = 'quote-1';

  const quoteWith = (status: QuoteStatus): Quote =>
    ({
      id: quoteId,
      serviceOrderId: orderId,
      version: 1,
      sourceQuoteId: null,
      currencyCode: 'USD',
      status,
      subtotal: 20,
      discount: 2,
      tax: 1,
      total: 19,
      items: [
        {
          id: 'item-1',
          type: 'PART',
          description: 'Filtro de aceite',
          quantity: 2,
          unitPrice: 10,
          costPrice: 6,
          total: 20,
          inventoryProductId: null,
          isApproved: null,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
    }) as Quote;

  const validInput: QuoteInput = {
    currencyCode: 'USD',
    items: [
      { type: 'PART', description: 'Filtro de aceite', quantity: 2, unitPrice: 10, costPrice: 6 },
    ],
    discount: 2,
    tax: 1,
  };

  function createWith(quotes: Partial<QuotesService>) {
    TestBed.configureTestingModule({
      imports: [QuoteEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ orderId, quoteId }) } },
        },
        { provide: QuotesService, useValue: quotes },
      ],
    });
    fixture = TestBed.createComponent(QuoteEditComponent);
    return fixture.componentInstance;
  }

  it('loads the draft quote and exposes it as editor input', () => {
    const get = vi.fn(() => of(quoteWith('DRAFT')));
    const component = createWith({ get });

    expect(get).toHaveBeenCalledWith(orderId, quoteId);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.initialValue()).toEqual(validInput);
  });

  it('refuses to edit a quote that is no longer a draft', () => {
    const component = createWith({ get: () => of(quoteWith('ACTIVE')) });

    expect(component.initialValue()).toBeNull();
    expect(component.error()).toBe('Solo se pueden editar borradores.');
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when the quote cannot be fetched', () => {
    const component = createWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.initialValue()).toBeNull();
    expect(component.error()).toBe('No pudimos cargar la cotización.');
    expect(component.loading()).toBe(false);
  });

  it('updates the quote and navigates to its detail', () => {
    const update = vi.fn(() => of(quoteWith('DRAFT')));
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ get: () => of(quoteWith('DRAFT')), update });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save(validInput);

    expect(update).toHaveBeenCalledWith(orderId, quoteId, validInput);
    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId, 'quotes', quoteId]);
    expect(component.pending()).toBe(false);
  });

  it('keeps the editable draft and explains a 409 status conflict', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({
      get: () => of(quoteWith('DRAFT')),
      update: () => throwError(() => ({ status: 409 })),
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save(validInput);

    expect(component.error()).toBe('La cotización ya no es un borrador editable.');
    expect(component.initialValue()).toEqual(validInput);
    expect(component.pending()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a generic error for other save failures', () => {
    const component = createWith({
      get: () => of(quoteWith('DRAFT')),
      update: () => throwError(() => ({ status: 500 })),
    });

    component.save(validInput);

    expect(component.error()).toBe('No pudimos guardar los cambios.');
    expect(component.pending()).toBe(false);
  });

  it('returns to the quote detail when editing is cancelled', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ get: () => of(quoteWith('DRAFT')) });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.cancel();

    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId, 'quotes', quoteId]);
  });
});
