import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { Vehicle } from '@core/models/vehicle.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import VehicleEditComponent from './vehicle-edit';

describe('VehicleEditComponent', () => {
  const customerId = 'cust-uuid-001';
  const vehicleId = 'veh-uuid-001';
  const vehicle: Vehicle = {
    id: vehicleId,
    customerId,
    plate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2019,
    color: null,
    vin: null,
    mileage: null,
    vehicleType: null,
    notes: null,
    serviceOrderCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(vehicles: Partial<VehiclesService>) {
    TestBed.configureTestingModule({
      imports: [VehicleEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ customerId, vehicleId }) } },
        },
        { provide: VehiclesService, useValue: vehicles },
      ],
    });
    return TestBed.createComponent(VehicleEditComponent).componentInstance;
  }

  it('loads the vehicle on construction', () => {
    const get = vi.fn(() => of(vehicle));
    const component = createWith({ get });

    expect(get).toHaveBeenCalledWith(customerId, vehicleId);
    expect(component.vehicle()).toEqual(vehicle);
    expect(component.loading()).toBe(false);
  });

  it('shows a load error when the vehicle cannot be fetched', () => {
    const component = createWith({ get: () => throwError(() => new Error('fail')) });

    expect(component.loadError()).toBe('No pudimos cargar el vehículo.');
  });

  it('navigates to the vehicle detail after a successful save', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ get: () => of(vehicle), update: () => of(vehicle) });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save({ plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' });

    expect(navigate).toHaveBeenCalledWith(['/customers', customerId, 'vehicles', vehicleId]);
    expect(component.pending()).toBe(false);
  });

  it('translates a duplicate plate conflict on save', () => {
    const component = createWith({
      get: () => of(vehicle),
      update: () => throwError(() => ({ status: 409 })),
    });

    component.save({ plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' });

    expect(component.saveError()).toBe('Ya existe un vehículo con esa placa en el taller.');
  });
});
