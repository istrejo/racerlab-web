import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { Customer, CustomersService } from '@core/services/customers/customers';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-customer-detail',
  imports: [DatePipe, LoadingSkeletonComponent, RouterLink],
  templateUrl: './customer-detail.html',
})
export default class CustomerDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly customers = inject(CustomersService);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly customer = signal<Customer | null>(null);
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
    this.customers.get(this.id).subscribe({
      next: (customer) => this.customer.set(customer),
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar el cliente.');
      },
      complete: () => this.loading.set(false),
    });
  }

  remove(): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.customers.remove(this.id).subscribe({
      next: () => void this.router.navigateByUrl('/customers'),
      error: (error: { status?: number }) => {
        this.deleting.set(false);
        this.deleteError.set(
          error.status === 409
            ? 'No se puede eliminar: el cliente tiene vehículos u órdenes asociados.'
            : 'No pudimos eliminar el cliente.',
        );
      },
      complete: () => this.deleting.set(false),
    });
  }
}
