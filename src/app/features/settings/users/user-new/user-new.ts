import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  assignableRoles,
  CreateMembershipRequest,
  MembershipsService,
  roleLabel,
} from '@core/services/memberships/memberships';

type CreatedCredentials = {
  name: string;
  email: string;
  password: string;
};

@Component({
  selector: 'app-user-new',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-new.html',
  styles: `
    .field {
      height: 2.75rem;
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid rgb(203 213 225);
      padding-inline: 0.75rem;
      outline: none;
    }
    .field:focus {
      border-color: #004ac6;
      box-shadow: 0 0 0 3px rgb(0 74 198 / 0.18);
    }
  `,
})
export default class UserNewComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly memberships = inject(MembershipsService);

  readonly roles = assignableRoles;
  readonly labelFor = roleLabel;
  readonly pending = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly copied = signal(false);
  readonly credentials = signal<CreatedCredentials | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.maxLength(32)]],
    address: ['', [Validators.maxLength(255)]],
    role: ['TECHNICIAN' as Exclude<CreateMembershipRequest['role'], 'OWNER'>, Validators.required],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  generatePassword(): void {
    this.form.controls.password.setValue(createTemporaryPassword());
    this.showPassword.set(true);
  }

  submit(): void {
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const request: CreateMembershipRequest = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim() || null,
      address: raw.address.trim() || null,
      role: raw.role,
      password: raw.password,
    };
    this.pending.set(true);
    this.memberships.create(request).subscribe({
      next: (membership) => {
        this.credentials.set({
          name: membership.name,
          email: membership.user.email,
          password: raw.password,
        });
        this.form.reset();
      },
      error: (error: { status?: number }) => {
        this.pending.set(false);
        this.serverError.set(
          error.status === 409
            ? 'Ese correo ya está registrado.'
            : 'No pudimos crear el usuario. Intentá nuevamente.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }

  async copyCredentials(credentials: CreatedCredentials): Promise<void> {
    const value = [
      `Nombre: ${credentials.name}`,
      `Correo: ${credentials.email}`,
      `Contraseña temporal: ${credentials.password}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}

export function createTemporaryPassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(length);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}
