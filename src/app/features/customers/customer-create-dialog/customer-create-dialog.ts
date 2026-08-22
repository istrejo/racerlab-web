import { Component, inject, output, signal } from '@angular/core';
import { Customer, CustomerInput } from '@core/models/customer.interface';
import { CustomersService } from '@core/services/customers/customers';
import { AppModalComponent } from '@shared/components/app-modal/app-modal';
import { CustomerFormComponent } from '../customer-form/customer-form';

@Component({
  selector: 'app-customer-create-dialog',
  imports: [AppModalComponent, CustomerFormComponent],
  templateUrl: './customer-create-dialog.html',
})
export class CustomerCreateDialogComponent {
  private readonly customers = inject(CustomersService);

  readonly created = output<Customer>();
  readonly closed = output<void>();
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  save(input: CustomerInput): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.customers.create(input).subscribe({
      next: (customer) => this.created.emit(customer),
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
