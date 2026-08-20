import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { Vehicle } from '@core/models/vehicle.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import VehicleNewComponent from './vehicle-new';

describe('VehicleNewComponent', () => {
  const customerId = 'cust-uuid-001';
  const vehicle: Vehicle = {
    id: 'veh-uuid-001',
    customerId,
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

  function createWith(vehicles: Partial<VehiclesService>) {
    TestBed.configureTestingModule({
      imports: [VehicleNewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ customerId }) } },
        },
        { provide: VehiclesService, useValue: vehicles },
      ],
    });
    return TestBed.createComponent(VehicleNewComponent).componentInstance;
  }

  it('navigates to the new vehicle detail after a successful save', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const component = createWith({ create: () => of(vehicle) });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);

    component.save({ plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' });

    expect(navigate).toHaveBeenCalledWith(['/customers', customerId, 'vehicles', vehicle.id]);
    expect(component.pending()).toBe(false);
  });

  it('translates a duplicate plate conflict', () => {
    const component = createWith({ create: () => throwError(() => ({ status: 409 })) });

    component.save({ plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' });

    expect(component.error()).toBe('Ya existe un vehículo con esa placa en el taller.');
    expect(component.pending()).toBe(false);
  });

  it('shows a generic error for other failures', () => {
    const component = createWith({ create: () => throwError(() => ({ status: 500 })) });

    component.save({ plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' });

    expect(component.error()).toBe('No pudimos crear el vehículo.');
  });
});
