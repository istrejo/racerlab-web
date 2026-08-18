import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { of, throwError } from 'rxjs';
import VehicleDetailComponent from './vehicle-detail';
import { Vehicle } from '@core/models/vehicle.interface';

describe('VehicleDetailComponent', () => {
  let fixture: ComponentFixture<VehicleDetailComponent>;
  const canDelete = signal(false);
  const customerId = 'cust-uuid-001';
  const vehicleId = 'veh-uuid-001';

  const vehicle: Vehicle = {
    id: vehicleId,
    customerId,
    plate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2019,
    color: 'Blanco',
    vin: null,
    mileage: 45000,
    vehicleType: 'Sedán',
    notes: null,
    serviceOrderCount: 3,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  beforeEach(() => {
    canDelete.set(false);
    TestBed.configureTestingModule({
      imports: [VehicleDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ customerId, vehicleId }),
            },
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            canWriteVehicles: () => false,
            canDeleteVehicles: canDelete,
          },
        },
        {
          provide: VehiclesService,
          useValue: {
            get: () => of(vehicle),
            remove: () => throwError(() => ({ status: 409 })),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(VehicleDetailComponent);
    fixture.detectChanges();
  });

  it('shows vehicle data while hiding manager actions from technicians', () => {
    expect(fixture.nativeElement.textContent).toContain('ABC1234');
    expect(fixture.nativeElement.textContent).toContain('Toyota');
    expect(fixture.nativeElement.textContent).toContain('3');
    expect(fixture.nativeElement.textContent).not.toContain('Editar vehículo');
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar vehículo');
  });

  it('shows deletion only to allowed roles and translates relation conflicts', () => {
    canDelete.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Eliminar vehículo');

    fixture.componentInstance.remove();
    fixture.detectChanges();

    expect(fixture.componentInstance.deleteError()).toBe(
      'No se puede eliminar: el vehículo tiene órdenes de servicio asociadas.',
    );
  });
});
