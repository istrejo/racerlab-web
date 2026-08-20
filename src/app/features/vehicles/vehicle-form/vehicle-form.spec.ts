import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Vehicle } from '@core/models/vehicle.interface';
import { vi } from 'vitest';
import { VehicleFormComponent } from './vehicle-form';

describe('VehicleFormComponent', () => {
  let fixture: ComponentFixture<VehicleFormComponent>;

  const vehicle: Vehicle = {
    id: 'veh-uuid-001',
    customerId: 'cust-uuid-001',
    plate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2019,
    color: 'Blanco',
    vin: '1HGCM82633A004352',
    mileage: 45000,
    vehicleType: 'Sedán',
    notes: 'Sin observaciones',
    serviceOrderCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleFormComponent);
  });

  it('fills the form when a vehicle input is provided', () => {
    fixture.componentRef.setInput('vehicle', vehicle);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      plate: 'ABC1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2019,
    });
  });

  it('does not emit when required fields are missing', () => {
    fixture.detectChanges();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);

    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('normalizes the plate and emits the submitted value', () => {
    fixture.detectChanges();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);

    fixture.componentInstance.form.setValue({
      plate: '  abc 1234 ',
      brand: 'Toyota',
      model: 'Corolla',
      year: null,
      color: '',
      vin: '',
      mileage: null,
      vehicleType: '',
      notes: '',
    });
    fixture.componentInstance.submit();

    expect(submitted).toHaveBeenCalledWith({
      plate: 'ABC1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: null,
      color: null,
      vin: null,
      mileage: null,
      vehicleType: null,
      notes: null,
    });
  });

  it('rejects a year outside the valid range', () => {
    fixture.detectChanges();
    fixture.componentInstance.form.controls.year.setValue(1800);

    expect(fixture.componentInstance.form.controls.year.errors).toEqual({
      outOfRange: { min: 1900, max: new Date().getFullYear() + 1 },
    });
  });
});
