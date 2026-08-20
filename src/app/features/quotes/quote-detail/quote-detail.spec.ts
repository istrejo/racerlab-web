import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { QuotesService } from '@core/services/quotes/quotes';
import { Quote } from '@core/models/quotes.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import QuoteDetailComponent from './quote-detail';

describe('QuoteDetailComponent', () => {
  const orderId = 'order-1';
  const quoteId = 'quote-1';
  const quote: Quote = {
    id: quoteId,
    serviceOrderId: orderId,
    status: 'ACTIVE',
    subtotal: 100,
    discount: null,
    tax: null,
    total: 100,
    approvalMethod: null,
    approvedAt: null,
    rejectedAt: null,
    createdBy: { userId: 'user-1', displayName: 'Ada' },
    items: [],
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(quotes: Partial<QuotesService>) {
    TestBed.configureTestingModule({
      imports: [QuoteDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ orderId, quoteId }) } },
        },
        { provide: PermissionsService, useValue: { canWriteQuotes: () => true } },
        { provide: QuotesService, useValue: quotes },
      ],
    });
    return TestBed.createComponent(QuoteDetailComponent).componentInstance;
  }

  it('loads the quote on construction', () => {
    const get = vi.fn(() => of(quote));
    const component = createWith({ get });

    expect(get).toHaveBeenCalledWith(orderId, quoteId);
    expect(component.quote()).toEqual(quote);
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when the quote cannot be fetched', () => {
    const component = createWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.error()).toBe('No pudimos cargar la cotización.');
  });

  it('lists the allowed next statuses for the current status', () => {
    const component = createWith({ get: () => of(quote) });

    expect(component.allowedNextStatuses('ACTIVE')).toEqual([
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
    ]);
    expect(component.allowedNextStatuses('APPROVED')).toEqual([]);
  });

  it('requires an approval method only for APPROVED/REJECTED transitions', () => {
    const component = createWith({ get: () => of(quote) });

    expect(component.requiresMethod('APPROVED')).toBe(true);
    expect(component.requiresMethod('REJECTED')).toBe(true);
    expect(component.requiresMethod('CANCELLED')).toBe(false);
    expect(component.requiresMethod(null)).toBe(false);
  });

  it('does not change status without a required approval method', () => {
    const changeStatus = vi.fn();
    const component = createWith({ get: () => of(quote), changeStatus });

    component.openStatusDialog();
    component.statusForm.setValue({ status: 'APPROVED', approvalMethod: '' });
    component.changeStatus();

    expect(changeStatus).not.toHaveBeenCalled();
    expect(component.actionError()).toBe('Indica el método de aprobación o rechazo.');
  });

  it('changes the status and closes the dialog on success', () => {
    const updatedQuote = { ...quote, status: 'APPROVED' as const };
    const changeStatus = vi.fn(() => of(updatedQuote));
    const component = createWith({ get: () => of(quote), changeStatus });

    component.openStatusDialog();
    component.statusForm.setValue({ status: 'APPROVED', approvalMethod: 'Firma digital' });
    component.changeStatus();

    expect(changeStatus).toHaveBeenCalledWith(orderId, quoteId, {
      status: 'APPROVED',
      approvalMethod: 'Firma digital',
    });
    expect(component.quote()).toEqual(updatedQuote);
    expect(component.dialogOpen()).toBe(false);
  });

  it('shows the server error message when the status change fails', () => {
    const component = createWith({
      get: () => of(quote),
      changeStatus: () => throwError(() => ({ error: { message: 'Transición inválida.' } })),
    });

    component.openStatusDialog();
    component.statusForm.setValue({ status: 'CANCELLED', approvalMethod: '' });
    component.changeStatus();

    expect(component.actionError()).toBe('Transición inválida.');
    expect(component.actionPending()).toBe(false);
  });
});
