import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { Vehicle, VehiclesService } from '@core/services/vehicles/vehicles';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-vehicle-detail',
  imports: [DecimalPipe, LoadingSkeletonComponent, RouterLink],
  templateUrl: './vehicle-detail.html',
})
export class VehicleDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly vehicles = inject(VehiclesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly customerId = this.route.snapshot.paramMap.get('customerId') ?? '';
  readonly vehicleId = this.route.snapshot.paramMap.get('vehicleId') ?? '';

  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleteOpen = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.vehicles.get(this.customerId, this.vehicleId).subscribe({
      next: (vehicle) => this.vehicle.set(vehicle),
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar el vehículo.');
      },
      complete: () => this.loading.set(false),
    });
  }

  remove(): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.vehicles.remove(this.customerId, this.vehicleId).subscribe({
      next: () => void this.router.navigate(['/customers', this.customerId, 'vehicles']),
      error: (err: { status?: number }) => {
        this.deleting.set(false);
        this.deleteError.set(
          err.status === 409
            ? 'No se puede eliminar: el vehículo tiene órdenes de servicio asociadas.'
            : 'No pudimos eliminar el vehículo.',
        );
      },
      complete: () => this.deleting.set(false),
    });
  }
}
