import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Quote, QuoteInput } from '@core/models/quotes.interface';
import { QuotesService } from '@core/services/quotes/quotes';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { QuoteEditorComponent } from '../quote-editor/quote-editor';
import QuoteNewComponent from './quote-new';

describe('QuoteNewComponent', () => {
  let fixture: ComponentFixture<QuoteNewComponent>;
  const orderId = 'order-1';
  const quote = { id: 'quote-1' } as Quote;

  const validInput: QuoteInput = {
    currencyCode: 'EUR',
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
  };

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

  it('renders the shared quote editor instead of its own form', () => {
    createWith({});
    fixture.detectChanges();

    expect(fixture.debugElement.children.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('app-quote-editor')).not.toBeNull();
  });

  it('creates the quote and navigates to the created draft', () => {
    const create = vi.fn(() => of(quote));
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ create });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save(validInput);

    expect(create).toHaveBeenCalledWith(orderId, validInput);
    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId, 'quotes', quote.id]);
    expect(component.pending()).toBe(false);
  });

  it('keeps the editor mounted and shows the server error when saving fails', () => {
    const component = createWith({
      create: () => throwError(() => ({ error: { message: 'No hay stock suficiente.' } })),
    });

    component.save(validInput);
    fixture.detectChanges();

    expect(component.error()).toBe('No hay stock suficiente.');
    expect(component.pending()).toBe(false);
    expect(
      fixture.debugElement.query((node) => node.componentInstance instanceof QuoteEditorComponent),
    ).not.toBeNull();
  });

  it('falls back to a generic message when the server sends no detail', () => {
    const component = createWith({ create: () => throwError(() => ({ status: 500 })) });

    component.save(validInput);

    expect(component.error()).toBe('No pudimos guardar la cotización.');
  });

  it('returns to the service order when creation is cancelled', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ create: vi.fn() });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.cancel();

    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId]);
  });
});
