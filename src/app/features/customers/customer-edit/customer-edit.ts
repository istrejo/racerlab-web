import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer, CustomerInput, CustomersService } from '@core/services/customers/customers';
import { CustomerFormComponent } from '../customer-form/customer-form';

@Component({
  selector: 'app-customer-edit',
  imports: [CustomerFormComponent, RouterLink],
  templateUrl: './customer-edit.html',
})
export class CustomerEditComponent {
  private readonly customers = inject(CustomersService);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly customer = signal<Customer | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.customers.get(this.id).subscribe({
      next: (customer) => this.customer.set(customer),
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar el cliente.');
      },
      complete: () => this.loading.set(false),
    });
  }

  save(input: CustomerInput): void {
    this.pending.set(true);
    this.error.set(null);
    this.customers.update(this.id, input).subscribe({
      next: () => void this.router.navigate(['/customers', this.id]),
      error: (error: { status?: number }) => {
        this.pending.set(false);
        this.error.set(
          error.status === 409
            ? 'Ya existe un cliente con ese documento.'
            : 'No pudimos guardar los cambios.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
