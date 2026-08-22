import { TestBed } from '@angular/core/testing';
import { Customer, CustomerInput } from '@core/models/customer.interface';
import { CustomersService } from '@core/services/customers/customers';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CustomerCreateDialogComponent } from './customer-create-dialog';

describe('CustomerCreateDialogComponent', () => {
  const input: CustomerInput = {
    fullName: 'Ada Lovelace',
    phone: null,
    whatsapp: null,
    email: null,
    document: 'DOC-1',
    address: null,
    notes: null,
  };
  const customer = {
    id: 'customer-1',
    ...input,
    vehicleCount: 0,
    serviceOrderCount: 0,
    createdAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  } as Customer;

  function create(createCustomer: ReturnType<typeof vi.fn>) {
    TestBed.configureTestingModule({
      imports: [CustomerCreateDialogComponent],
      providers: [{ provide: CustomersService, useValue: { create: createCustomer } }],
    });
    return TestBed.createComponent(CustomerCreateDialogComponent).componentInstance;
  }

  it('emits the created customer', () => {
    const component = create(vi.fn(() => of(customer)));
    const created = vi.fn();
    component.created.subscribe(created);

    component.save(input);

    expect(created).toHaveBeenCalledWith(customer);
    expect(component.pending()).toBe(false);
  });

  it('keeps entered data available and explains document conflicts', () => {
    const component = create(vi.fn(() => throwError(() => ({ status: 409 }))));

    component.save(input);

    expect(component.error()).toBe('Ya existe un cliente con ese documento.');
    expect(component.pending()).toBe(false);
  });

  it('prevents a second submission while saving', () => {
    const request = new Subject<Customer>();
    const createCustomer = vi.fn(() => request.asObservable());
    const component = create(createCustomer);

    component.save(input);
    component.save(input);

    expect(createCustomer).toHaveBeenCalledOnce();
    expect(component.pending()).toBe(true);
  });
});
