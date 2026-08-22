import { Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Vehicle, VehicleInput } from '@core/models/vehicle.interface';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function integerInRange(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === '' || raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) {
      return { outOfRange: { min, max } };
    }
    return null;
  };
}

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-form.html',
  styles: `
    .field {
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid rgb(203 213 225);
      padding: 0.7rem 0.75rem;
      outline: none;
    }
    .field:focus {
      border-color: #004ac6;
      box-shadow: 0 0 0 3px rgb(0 74 198 / 0.18);
    }
  `,
})
export class VehicleFormComponent {
  readonly vehicle = input<Vehicle | null>(null);
  readonly pending = input(false);
  readonly submitted = output<VehicleInput>();
  readonly cancelled = output<void>();

  readonly currentYear = new Date().getFullYear();

  readonly form = new FormGroup({
    plate: new FormControl('', {
      nonNullable: true,
      validators: [trimmedRequired, Validators.maxLength(20)],
    }),
    brand: new FormControl('', {
      nonNullable: true,
      validators: [trimmedRequired, Validators.maxLength(80)],
    }),
    model: new FormControl('', {
      nonNullable: true,
      validators: [trimmedRequired, Validators.maxLength(80)],
    }),
    year: new FormControl<number | null>(null, {
      validators: [integerInRange(1900, new Date().getFullYear() + 1)],
    }),
    color: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(50),
    }),
    vin: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(17),
    }),
    mileage: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
    vehicleType: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(50),
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(2000),
    }),
  });

  constructor() {
    effect(() => {
      const vehicle = this.vehicle();
      if (vehicle) {
        this.form.setValue({
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color ?? '',
          vin: vehicle.vin ?? '',
          mileage: vehicle.mileage,
          vehicleType: vehicle.vehicleType ?? '',
          notes: vehicle.notes ?? '',
        });
      }
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.pending()) {
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      plate: value.plate.trim().replace(/\s+/g, '').toUpperCase(),
      brand: value.brand.trim(),
      model: value.model.trim(),
      year: value.year ?? null,
      color: value.color.trim() || null,
      vin: value.vin.trim() || null,
      mileage: value.mileage ?? null,
      vehicleType: value.vehicleType.trim() || null,
      notes: value.notes.trim() || null,
    });
  }
}
