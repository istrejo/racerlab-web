import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form';
import { Vehicle, VehicleInput } from '@core/models/vehicle.interface';

@Component({
  selector: 'app-vehicle-edit',
  imports: [VehicleFormComponent, LoadingSkeletonComponent, RouterLink],
  templateUrl: './vehicle-edit.html',
})
export default class VehicleEditComponent {
  private readonly vehicles = inject(VehiclesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly customerId = this.route.snapshot.paramMap.get('customerId') ?? '';
  readonly vehicleId = this.route.snapshot.paramMap.get('vehicleId') ?? '';

  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly pending = signal(false);
  readonly saveError = signal<string | null>(null);

  cancel(): void {
    void this.router.navigate(['/customers', this.customerId, 'vehicles', this.vehicleId]);
  }

  constructor() {
    this.vehicles.get(this.customerId, this.vehicleId).subscribe({
      next: (vehicle) => this.vehicle.set(vehicle),
      error: () => {
        this.loading.set(false);
        this.loadError.set('No pudimos cargar el vehículo.');
      },
      complete: () => this.loading.set(false),
    });
  }

  save(input: VehicleInput): void {
    this.pending.set(true);
    this.saveError.set(null);
    this.vehicles.update(this.customerId, this.vehicleId, input).subscribe({
      next: () =>
        void this.router.navigate(['/customers', this.customerId, 'vehicles', this.vehicleId]),
      error: (err: { status?: number }) => {
        this.pending.set(false);
        this.saveError.set(
          err.status === 409
            ? 'Ya existe un vehículo con esa placa en el taller.'
            : 'No pudimos guardar los cambios.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
