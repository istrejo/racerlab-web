import { TestBed } from '@angular/core/testing';
import { Vehicle, VehicleInput } from '@core/models/vehicle.interface';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { VehicleCreateDialogComponent } from './vehicle-create-dialog';

describe('VehicleCreateDialogComponent', () => {
  const input: VehicleInput = {
    plate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: null,
    color: null,
    vin: null,
    mileage: null,
    vehicleType: null,
    notes: null,
  };
  const vehicle = {
    id: 'vehicle-1',
    customerId: 'customer-1',
    ...input,
    serviceOrderCount: 0,
    createdAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  } as Vehicle;

  function create(createVehicle: ReturnType<typeof vi.fn>) {
    TestBed.configureTestingModule({
      imports: [VehicleCreateDialogComponent],
      providers: [{ provide: VehiclesService, useValue: { create: createVehicle } }],
    });
    const fixture = TestBed.createComponent(VehicleCreateDialogComponent);
    fixture.componentRef.setInput('customerId', 'customer-1');
    return fixture.componentInstance;
  }

  it('creates the vehicle for the selected customer and emits it', () => {
    const createVehicle = vi.fn(() => of(vehicle));
    const component = create(createVehicle);
    const created = vi.fn();
    component.created.subscribe(created);

    component.save(input);

    expect(createVehicle).toHaveBeenCalledWith('customer-1', input);
    expect(created).toHaveBeenCalledWith(vehicle);
  });

  it('explains plate conflicts without closing the dialog', () => {
    const component = create(vi.fn(() => throwError(() => ({ status: 409 }))));

    component.save(input);

    expect(component.error()).toBe('Ya existe un vehículo con esa placa en el taller.');
    expect(component.pending()).toBe(false);
  });

  it('prevents a second submission while saving', () => {
    const request = new Subject<Vehicle>();
    const createVehicle = vi.fn(() => request.asObservable());
    const component = create(createVehicle);

    component.save(input);
    component.save(input);

    expect(createVehicle).toHaveBeenCalledOnce();
    expect(component.pending()).toBe(true);
  });
});
