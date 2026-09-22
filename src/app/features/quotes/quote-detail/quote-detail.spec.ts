import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { QuotesService } from '@core/services/quotes/quotes';
import { Quote, QuoteStatus } from '@core/models/quotes.interface';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import QuoteDetailComponent from './quote-detail';

describe('QuoteDetailComponent', () => {
  const orderId = 'order-1';
  const quoteId = 'quote-1';
  const quote: Quote = {
    id: quoteId,
    serviceOrderId: orderId,
    version: 2,
    sourceQuoteId: 'quote-0',
    currencyCode: 'EUR',
    status: 'ACTIVE',
    subtotal: 100,
    discount: null,
    tax: null,
    total: 100,
    approvalMethod: null,
    approvalMethodDetail: null,
    approvedAt: null,
    rejectedAt: null,
    createdBy: { userId: 'user-1', displayName: 'Ada' },
    items: [],
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(quotes: Partial<QuotesService>, canWriteQuotes = true) {
    TestBed.configureTestingModule({
      imports: [QuoteDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ orderId, quoteId }) } },
        },
        { provide: PermissionsService, useValue: { canWriteQuotes: () => canWriteQuotes } },
        { provide: QuotesService, useValue: quotes },
      ],
    });
    return TestBed.createComponent(QuoteDetailComponent);
  }

  function componentWith(quotes: Partial<QuotesService>, canWriteQuotes = true) {
    return createWith(quotes, canWriteQuotes).componentInstance;
  }

  function quoteWith(status: QuoteStatus): Quote {
    return { ...quote, status };
  }

  it('loads the quote on construction', () => {
    const get = vi.fn(() => of(quote));
    const component = componentWith({ get });

    expect(get).toHaveBeenCalledWith(orderId, quoteId);
    expect(component.quote()).toEqual(quote);
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when the quote cannot be fetched', () => {
    const component = componentWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.error()).toBe('No pudimos cargar la cotización.');
  });

  it('exposes the version label of the loaded quote', () => {
    const component = componentWith({ get: () => of(quote) });

    expect(component.versionLabel()).toBe('Cotización v2');
  });

  it('exposes only the actions defined for the current status', () => {
    const component = componentWith({ get: () => of(quoteWith('DRAFT')) });

    expect(component.actions().map((action) => action.kind)).toEqual([
      'edit',
      'activate',
      'cancel',
    ]);
  });

  it('exposes no action for an APPROVED quote', () => {
    const component = componentWith({ get: () => of(quoteWith('APPROVED')) });

    expect(component.actions()).toEqual([]);
  });

  it('exposes no action without write permission', () => {
    const component = componentWith({ get: () => of(quote) }, false);

    expect(component.actions()).toEqual([]);
  });

  it('navigates to the edit route instead of opening a modal for the edit action', () => {
    const component = componentWith({ get: () => of(quoteWith('DRAFT')) });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.runAction('edit');

    expect(navigate).toHaveBeenCalledWith(['/service-orders', orderId, 'quotes', quoteId, 'edit']);
    expect(component.activeAction()).toBeNull();
  });

  it('opens an action-specific modal for a lifecycle action', () => {
    const component = componentWith({ get: () => of(quote) });

    component.runAction('approve');

    expect(component.activeAction()?.kind).toBe('approve');
    expect(component.modalTitle()).toBe('Aprobar cotización');
    expect(component.methodRequired()).toBe(true);
  });

  it('keeps approval unavailable until a method is chosen', () => {
    const changeStatus = vi.fn();
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('approve');

    expect(component.canConfirm()).toBe(false);
    component.confirmAction();
    expect(changeStatus).not.toHaveBeenCalled();
  });

  it('keeps approval unavailable while OTHER has no detail', () => {
    const changeStatus = vi.fn();
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('approve');
    component.approvalMethod.set('OTHER');
    expect(component.canConfirm()).toBe(false);

    component.approvalMethodDetail.set('   ');
    expect(component.canConfirm()).toBe(false);

    component.approvalMethodDetail.set('Acta firmada');
    expect(component.canConfirm()).toBe(true);
  });

  it('omits the detail when the method is not OTHER', () => {
    const changeStatus = vi.fn(() => of(quoteWith('APPROVED')));
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('approve');
    component.approvalMethod.set('IN_PERSON');
    component.approvalMethodDetail.set('se ignora');
    component.confirmAction();

    expect(changeStatus).toHaveBeenCalledWith(orderId, quoteId, {
      status: 'APPROVED',
      approvalMethod: 'IN_PERSON',
    });
  });

  it('sends the trimmed detail for the OTHER method', () => {
    const changeStatus = vi.fn(() => of(quoteWith('REJECTED')));
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('reject');
    component.approvalMethod.set('OTHER');
    component.approvalMethodDetail.set('  Nota del cliente  ');
    component.confirmAction();

    expect(changeStatus).toHaveBeenCalledWith(orderId, quoteId, {
      status: 'REJECTED',
      approvalMethod: 'OTHER',
      approvalMethodDetail: 'Nota del cliente',
    });
  });

  it('sends no method for a decision that does not require one', () => {
    const updated = quoteWith('CANCELLED');
    const changeStatus = vi.fn(() => of(updated));
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('cancel');
    component.confirmAction();

    expect(changeStatus).toHaveBeenCalledWith(orderId, quoteId, { status: 'CANCELLED' });
    expect(component.quote()).toEqual(updated);
    expect(component.activeAction()).toBeNull();
  });

  it('submits a pending decision only once', () => {
    const pending = new Subject<Quote>();
    const changeStatus = vi.fn(() => pending.asObservable());
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('expire');
    component.confirmAction();
    component.confirmAction();

    expect(changeStatus).toHaveBeenCalledTimes(1);
    expect(component.actionPending()).toBe(true);
  });

  it('locks dismissal while the decision is pending', () => {
    const changeStatus = vi.fn(() => new Subject<Quote>().asObservable());
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('expire');
    component.confirmAction();
    component.dismissAction();

    expect(component.activeAction()?.kind).toBe('expire');
  });

  it('keeps the modal open with the previous status and allows retry after a failure', () => {
    let attempt = 0;
    const changeStatus = vi.fn(() => {
      attempt += 1;
      return attempt === 1
        ? throwError(() => ({ error: { message: 'Transición inválida.' } }))
        : of(quoteWith('EXPIRED'));
    });
    const component = componentWith({ get: () => of(quote), changeStatus });

    component.runAction('expire');
    component.confirmAction();

    expect(component.actionError()).toBe('Transición inválida.');
    expect(component.actionPending()).toBe(false);
    expect(component.activeAction()?.kind).toBe('expire');
    expect(component.quote()?.status).toBe('ACTIVE');

    component.confirmAction();

    expect(component.quote()?.status).toBe('EXPIRED');
    expect(component.activeAction()).toBeNull();
  });

  it('resets the decision inputs when a new action opens', () => {
    const component = componentWith({ get: () => of(quote), changeStatus: () => of(quote) });

    component.runAction('approve');
    component.approvalMethod.set('EMAIL');
    component.approvalMethodDetail.set('detalle');
    component.dismissAction();
    component.runAction('reject');

    expect(component.approvalMethod()).toBe('');
    expect(component.approvalMethodDetail()).toBe('');
    expect(component.actionError()).toBeNull();
  });

  it('creates a version and opens the new draft editor', () => {
    const draft = { ...quote, id: 'quote-2', version: 3, status: 'DRAFT' as const };
    const createVersion = vi.fn(() => of(draft));
    const component = componentWith({ get: () => of(quote), createVersion });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.runAction('version');
    component.confirmAction();

    expect(createVersion).toHaveBeenCalledWith(orderId, quoteId);
    expect(navigate).toHaveBeenCalledWith([
      '/service-orders',
      orderId,
      'quotes',
      'quote-2',
      'edit',
    ]);
  });

  it('keeps the quote unchanged when versioning fails', () => {
    const component = componentWith({
      get: () => of(quote),
      createVersion: () => throwError(() => ({ error: { message: 'No disponible.' } })),
    });

    component.runAction('version');
    component.confirmAction();

    expect(component.actionError()).toBe('No disponible.');
    expect(component.quote()).toEqual(quote);
    expect(component.activeAction()?.kind).toBe('version');
  });
});
