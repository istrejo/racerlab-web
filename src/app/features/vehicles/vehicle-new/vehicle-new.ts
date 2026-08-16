import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form';
import { VehicleInput } from '@core/models/vehicle.interface';

@Component({
  selector: 'app-vehicle-new',
  imports: [VehicleFormComponent, RouterLink],
  templateUrl: './vehicle-new.html',
})
export default class VehicleNewComponent {
  private readonly vehicles = inject(VehiclesService);
  private readonly router = inject(Router);
  readonly customerId = inject(ActivatedRoute).snapshot.paramMap.get('customerId') ?? '';
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  save(input: VehicleInput): void {
    this.pending.set(true);
    this.error.set(null);
    this.vehicles.create(this.customerId, input).subscribe({
      next: (vehicle) =>
        void this.router.navigate(['/customers', this.customerId, 'vehicles', vehicle.id]),
      error: (err: { status?: number }) => {
        this.pending.set(false);
        this.error.set(
          err.status === 409
            ? 'Ya existe un vehículo con esa placa en el taller.'
            : 'No pudimos crear el vehículo.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
