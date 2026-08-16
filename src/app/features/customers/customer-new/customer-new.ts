import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CustomersService } from '@core/services/customers/customers';
import { CustomerFormComponent } from '../customer-form/customer-form';
import { CustomerInput } from '@core/models/customer.interface';

@Component({
  selector: 'app-customer-new',
  imports: [CustomerFormComponent, RouterLink],
  templateUrl: './customer-new.html',
})
export default class CustomerNewComponent {
  private readonly customers = inject(CustomersService);
  private readonly router = inject(Router);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  save(input: CustomerInput): void {
    this.pending.set(true);
    this.error.set(null);
    this.customers.create(input).subscribe({
      next: (customer) => void this.router.navigate(['/customers', customer.id]),
      error: (error: { status?: number }) => {
        this.pending.set(false);
        this.error.set(
          error.status === 409
            ? 'Ya existe un cliente con ese documento.'
            : 'No pudimos crear el cliente.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
