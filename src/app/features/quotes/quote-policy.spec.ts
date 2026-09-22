import {
  QUOTE_APPROVAL_METHODS,
  QUOTE_APPROVAL_METHOD_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  quoteActionsFor,
  quoteVersionLabel,
  sortByVersionDesc,
} from './quote-policy';

describe('quote policy', () => {
  it('labels every status, including SUPERSEDED', () => {
    expect(QUOTE_STATUS_LABELS.DRAFT).toBe('Borrador');
    expect(QUOTE_STATUS_LABELS.SUPERSEDED).toBe('Reemplazada');
    expect(Object.keys(QUOTE_STATUS_LABELS)).toHaveLength(7);
    expect(Object.keys(QUOTE_STATUS_TONES)).toHaveLength(7);
  });

  it('exposes the controlled approval methods with labels', () => {
    expect(QUOTE_APPROVAL_METHODS).toEqual(['WHATSAPP', 'PHONE', 'IN_PERSON', 'EMAIL', 'OTHER']);
    expect(QUOTE_APPROVAL_METHOD_LABELS.IN_PERSON).toBe('En persona');
  });

  it('renders the version label', () => {
    expect(quoteVersionLabel(3)).toBe('Cotización v3');
  });

  it('offers the defined actions per status for a writer', () => {
    expect(quoteActionsFor('DRAFT', true).map((action) => action.kind)).toEqual([
      'edit',
      'activate',
      'cancel',
    ]);
    expect(quoteActionsFor('ACTIVE', true).map((action) => action.kind)).toEqual([
      'approve',
      'reject',
      'expire',
      'cancel',
      'version',
    ]);
    expect(quoteActionsFor('APPROVED', true)).toEqual([]);

    for (const status of ['REJECTED', 'EXPIRED', 'CANCELLED', 'SUPERSEDED'] as const) {
      expect(quoteActionsFor(status, true).map((action) => action.kind)).toEqual(['version']);
    }
  });

  it('offers no mutation action without write permission', () => {
    for (const status of [
      'DRAFT',
      'ACTIVE',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
      'SUPERSEDED',
    ] as const) {
      expect(quoteActionsFor(status, false)).toEqual([]);
    }
  });

  it('describes approve and reject as method-bound decisions', () => {
    const [approve, reject] = quoteActionsFor('ACTIVE', true);

    expect(approve.requiresMethod).toBe(true);
    expect(reject.requiresMethod).toBe(true);
    expect(approve.label).toBe('Aprobar');
    expect(approve.modalTitle).toBe('Aprobar cotización');
    expect(approve.status).toBe('APPROVED');
    expect(quoteActionsFor('ACTIVE', true)[2].requiresMethod).toBe(false);
  });

  it('sorts quotes newest version first without mutating the input', () => {
    const input = [{ version: 1 }, { version: 3 }, { version: 2 }];

    expect(sortByVersionDesc(input).map((quote) => quote.version)).toEqual([3, 2, 1]);
    expect(input.map((quote) => quote.version)).toEqual([1, 3, 2]);
  });
});
