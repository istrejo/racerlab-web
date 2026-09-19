import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuoteInput } from '@core/models/quotes.interface';
import { vi } from 'vitest';
import { QuoteEditorComponent } from './quote-editor';

describe('QuoteEditorComponent', () => {
  let fixture: ComponentFixture<QuoteEditorComponent>;
  let component: QuoteEditorComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoteEditorComponent);
    component = fixture.componentInstance;
  });

  it('starts in EUR and reacts to line, discount, and tax changes', () => {
    expect(component.model().currencyCode).toBe('EUR');
    component.model.set({
      currencyCode: 'EUR',
      items: [
        { type: 'LABOR', description: 'Ajuste', quantity: 2, unitPrice: 30, costPrice: null },
      ],
      discount: 5,
      tax: 3,
    });

    expect(component.lineTotals()).toEqual([60]);
    expect(component.subtotal()).toBe(60);
    expect(component.total()).toBe(58);
  });

  it('hydrates an existing draft and allows lines to be added and removed', () => {
    const initial: QuoteInput = {
      currencyCode: 'USD',
      items: [{ type: 'PART', description: 'Filtro', quantity: 1, unitPrice: 12, costPrice: 8 }],
      discount: 2,
      tax: 1,
    };
    fixture.componentRef.setInput('initialValue', initial);
    fixture.detectChanges();

    expect(JSON.parse(JSON.stringify(component.model()))).toEqual(initial);
    component.addItem();
    fixture.detectChanges();
    expect(component.model().items).toHaveLength(2);
    component.removeItem(0);
    fixture.detectChanges();
    expect(component.model().items).toHaveLength(1);
  });

  it('validates required lines and emits one normalized submission while pending', () => {
    const submitted = vi.fn();
    component.submitted.subscribe(submitted);
    component.save();
    expect(component.quoteForm().invalid()).toBe(true);
    expect(submitted).not.toHaveBeenCalled();

    component.model.set({
      currencyCode: ' usd ',
      items: [
        { type: 'PART', description: ' Filtro ', quantity: 2, unitPrice: 10, costPrice: null },
      ],
      discount: null,
      tax: null,
    });
    fixture.componentRef.setInput('pending', true);
    component.save();
    expect(submitted).not.toHaveBeenCalled();
    fixture.componentRef.setInput('pending', false);
    component.save();

    expect(submitted).toHaveBeenCalledOnce();
    expect(submitted).toHaveBeenCalledWith({
      currencyCode: 'USD',
      items: [{ type: 'PART', description: 'Filtro', quantity: 2, unitPrice: 10, costPrice: null }],
      discount: null,
      tax: null,
    });
  });
});
