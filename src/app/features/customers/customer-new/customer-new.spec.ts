import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomersService } from '@core/services/customers/customers';
import { throwError } from 'rxjs';
import CustomerNewComponent from './customer-new';

describe('CustomerNewComponent', () => {
  it('translates a duplicate document conflict', () => {
    TestBed.configureTestingModule({
      imports: [CustomerNewComponent],
      providers: [
        provideRouter([]),
        {
          provide: CustomersService,
          useValue: { create: () => throwError(() => ({ status: 409 })) },
        },
      ],
    });
    const component = TestBed.createComponent(CustomerNewComponent).componentInstance;

    component.save({ fullName: 'Ada Lovelace', document: 'ABC123' });

    expect(component.error()).toBe('Ya existe un cliente con ese documento.');
    expect(component.pending()).toBe(false);
  });
});
