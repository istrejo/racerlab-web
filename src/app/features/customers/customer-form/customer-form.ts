import { Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Customer, CustomerInput } from '@core/services/customers/customers';

function trimmedEmail(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value ? Validators.email({ value } as AbstractControl) : null;
}

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.html',
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
export class CustomerFormComponent {
  readonly customer = input<Customer | null>(null);
  readonly pending = input(false);
  readonly cancelHref = input('/customers');
  readonly submitted = output<CustomerInput>();

  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [trimmedRequired, Validators.maxLength(120)],
    }),
    phone: new FormControl('', { nonNullable: true, validators: Validators.maxLength(32) }),
    whatsapp: new FormControl('', { nonNullable: true, validators: Validators.maxLength(32) }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [trimmedEmail, Validators.maxLength(254)],
    }),
    document: new FormControl('', { nonNullable: true, validators: Validators.maxLength(64) }),
    address: new FormControl('', { nonNullable: true, validators: Validators.maxLength(255) }),
    notes: new FormControl('', { nonNullable: true, validators: Validators.maxLength(2000) }),
  });

  constructor() {
    effect(() => {
      const customer = this.customer();
      if (customer) {
        this.form.setValue({
          fullName: customer.fullName,
          phone: customer.phone ?? '',
          whatsapp: customer.whatsapp ?? '',
          email: customer.email ?? '',
          document: customer.document ?? '',
          address: customer.address ?? '',
          notes: customer.notes ?? '',
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
      fullName: value.fullName.trim(),
      phone: value.phone.trim() || null,
      whatsapp: value.whatsapp.trim() || null,
      email: value.email.trim().toLowerCase() || null,
      document: value.document.trim() || null,
      address: value.address.trim() || null,
      notes: value.notes.trim() || null,
    });
  }
}
