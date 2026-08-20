import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CustomersService } from '@core/services/customers/customers';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { Customer, CustomerPage } from '@core/models/customer.interface';
import { Vehicle } from '@core/models/vehicle.interface';
import { ServiceOrderDetail } from '@core/models/service-order.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import ServiceOrderNewComponent from './service-order-new';

describe('ServiceOrderNewComponent', () => {
  const customer: Customer = {
    id: 'cust-1',
    fullName: 'Ada Lovelace',
    phone: null,
    whatsapp: null,
    email: null,
    document: null,
    address: null,
    notes: null,
    vehicleCount: 1,
    serviceOrderCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  const vehicle: Vehicle = {
    id: 'veh-1',
    customerId: customer.id,
    plate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: null,
    color: null,
    vin: null,
    mileage: null,
    vehicleType: null,
    notes: null,
    serviceOrderCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(overrides: {
    customers?: Partial<CustomersService>;
    vehicles?: Partial<VehiclesService>;
    serviceOrders?: Partial<ServiceOrdersService>;
  }) {
    TestBed.configureTestingModule({
      imports: [ServiceOrderNewComponent],
      providers: [
        provideRouter([]),
        { provide: CustomersService, useValue: overrides.customers ?? {} },
        {
          provide: VehiclesService,
          useValue: overrides.vehicles ?? { list: () => of({ items: [], page: 1, limit: 100, total: 0, totalPages: 0 }) },
        },
        { provide: ServiceOrdersService, useValue: overrides.serviceOrders ?? {} },
      ],
    });
    return TestBed.createComponent(ServiceOrderNewComponent).componentInstance;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('searches customers after debouncing and ignores short queries', async () => {
    const emptyPage: CustomerPage = { items: [], page: 1, limit: 10, total: 0, totalPages: 0 };
    const list = vi.fn(() => of({ ...emptyPage, items: [customer] }));
    const component = createWith({ customers: { list } });

    component.customerSearch.setValue('a');
    await vi.advanceTimersByTimeAsync(300);
    expect(list).not.toHaveBeenCalled();

    component.customerSearch.setValue('ada');
    await vi.advanceTimersByTimeAsync(300);
    expect(list).toHaveBeenCalledWith({ search: 'ada', page: 1, limit: 10 });
    expect(component.customersPage()?.items).toEqual([customer]);
  });

  it('loads the customer vehicles when a customer is selected', () => {
    const list = vi.fn(() =>
      of({ items: [vehicle], page: 1, limit: 100, total: 1, totalPages: 1 }),
    );
    const component = createWith({ vehicles: { list } });

    component.selectCustomer(customer);
    TestBed.flushEffects();

    expect(list).toHaveBeenCalledWith(customer.id, { page: 1, limit: 100 });
    expect(component.vehicles()).toEqual([vehicle]);
    expect(component.step()).toBe('vehicle');
  });

  it('moves to the reception step after selecting a vehicle', () => {
    const component = createWith({});

    component.selectVehicle(vehicle);

    expect(component.selectedVehicle()).toEqual(vehicle);
    expect(component.step()).toBe('reception');
  });

  it('goes back one step at a time', () => {
    const component = createWith({});

    component.selectCustomer(customer);
    TestBed.flushEffects();
    component.selectVehicle(vehicle);
    expect(component.step()).toBe('reception');

    component.goBack();
    expect(component.step()).toBe('vehicle');

    component.goBack();
    expect(component.step()).toBe('customer');
  });

  it('does not submit without a selected customer and vehicle', () => {
    const create = vi.fn();
    const component = createWith({ serviceOrders: { create } });

    component.submit();

    expect(create).not.toHaveBeenCalled();
  });

  it('creates the service order and navigates to its detail', () => {
    const created = { id: 'order-1' } as ServiceOrderDetail;
    const create = vi.fn(() => of(created));
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ serviceOrders: { create } });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.selectCustomer(customer);
    TestBed.flushEffects();
    component.selectVehicle(vehicle);
    component.submit();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: customer.id, vehicleId: vehicle.id }),
    );
    expect(navigate).toHaveBeenCalledWith(['/service-orders', created.id]);
  });

  it('shows an error message when creation fails', () => {
    const component = createWith({
      serviceOrders: { create: () => throwError(() => new Error('fail')) },
    });

    component.selectCustomer(customer);
    TestBed.flushEffects();
    component.selectVehicle(vehicle);
    component.submit();

    expect(component.error()).toBe('No pudimos crear la orden de servicio.');
    expect(component.saving()).toBe(false);
  });
});
