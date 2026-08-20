import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { CustomersService } from '@core/services/customers/customers';
import { Customer } from '@core/models/customer.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import CustomerEditComponent from './customer-edit';

describe('CustomerEditComponent', () => {
  const customerId = 'cust-uuid-001';
  const customer: Customer = {
    id: customerId,
    fullName: 'Ada Lovelace',
    phone: null,
    whatsapp: null,
    email: null,
    document: null,
    address: null,
    notes: null,
    vehicleCount: 0,
    serviceOrderCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(customers: Partial<CustomersService>) {
    TestBed.configureTestingModule({
      imports: [CustomerEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: customerId }) } },
        },
        { provide: CustomersService, useValue: customers },
      ],
    });
    return TestBed.createComponent(CustomerEditComponent).componentInstance;
  }

  it('loads the customer on construction', () => {
    const get = vi.fn(() => of(customer));
    const component = createWith({ get });

    expect(get).toHaveBeenCalledWith(customerId);
    expect(component.customer()).toEqual(customer);
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when the customer cannot be fetched', () => {
    const component = createWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.error()).toBe('No pudimos cargar el cliente.');
    expect(component.loading()).toBe(false);
  });

  it('navigates to the customer detail after a successful save', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ get: () => of(customer), update: () => of(customer) });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save({ fullName: 'Ada Lovelace' });

    expect(navigate).toHaveBeenCalledWith(['/customers', customerId]);
    expect(component.pending()).toBe(false);
  });

  it('translates a duplicate document conflict on save', () => {
    const component = createWith({
      get: () => of(customer),
      update: () => throwError(() => ({ status: 409 })),
    });

    component.save({ fullName: 'Ada Lovelace' });

    expect(component.error()).toBe('Ya existe un cliente con ese documento.');
    expect(component.pending()).toBe(false);
  });

  it('shows a generic error for other save failures', () => {
    const component = createWith({
      get: () => of(customer),
      update: () => throwError(() => ({ status: 500 })),
    });

    component.save({ fullName: 'Ada Lovelace' });

    expect(component.error()).toBe('No pudimos guardar los cambios.');
  });
});
