import { Component, inject, input, output, signal } from '@angular/core';
import { Vehicle, VehicleInput } from '@core/models/vehicle.interface';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { AppModalComponent } from '@shared/components/app-modal/app-modal';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form';

@Component({
  selector: 'app-vehicle-create-dialog',
  imports: [AppModalComponent, VehicleFormComponent],
  templateUrl: './vehicle-create-dialog.html',
})
export class VehicleCreateDialogComponent {
  private readonly vehicles = inject(VehiclesService);

  readonly customerId = input.required<string>();
  readonly customerName = input<string | null>(null);
  readonly created = output<Vehicle>();
  readonly closed = output<void>();
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  save(input: VehicleInput): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.vehicles.create(this.customerId(), input).subscribe({
      next: (vehicle) => this.created.emit(vehicle),
      error: (error: { status?: number }) => {
        this.pending.set(false);
        this.error.set(
          error.status === 409
            ? 'Ya existe un vehículo con esa placa en el taller.'
            : 'No pudimos crear el vehículo.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
