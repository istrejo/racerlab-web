import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import {
  assignableRoles,
  MembershipsService,
  roleLabel,
} from '@core/services/memberships/memberships';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { createTemporaryPassword } from '../user-new/user-new';
import { Membership } from '@core/models/membership.interface';

@Component({
  selector: 'app-user-edit',
  imports: [LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './user-edit.html',
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
export default class UserEditComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly memberships = inject(MembershipsService);

  readonly roles = assignableRoles;
  readonly labelFor = roleLabel;
  readonly membership = signal<Membership | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly resetOpen = signal(false);
  readonly resetPending = signal(false);
  readonly resetError = signal<string | null>(null);
  readonly resetCredentials = signal<string | null>(null);
  readonly copied = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', Validators.maxLength(32)],
    address: ['', Validators.maxLength(255)],
    role: ['TECHNICIAN' as (typeof assignableRoles)[number], Validators.required],
    isActive: [true],
  });
  readonly resetForm = this.formBuilder.nonNullable.group({
    temporaryPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    ],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigateByUrl('/settings/users');
      return;
    }
    this.memberships.get(id).subscribe({
      next: (membership) => {
        this.membership.set(membership);
        if (membership.role !== 'OWNER') {
          this.form.setValue({
            name: membership.name,
            phone: membership.phone ?? '',
            address: membership.address ?? '',
            role: membership.role,
            isActive: membership.isActive,
          });
          if (this.isOwnMembership()) {
            this.form.controls.role.disable();
            this.form.controls.isActive.disable();
          }
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar este usuario.');
      },
      complete: () => this.loading.set(false),
    });
  }

  isOwnMembership(): boolean {
    return this.membership()?.id === this.auth.activeWorkshop()?.membershipId;
  }

  save(): void {
    const membership = this.membership();
    this.error.set(null);
    this.form.markAllAsTouched();
    if (!membership || this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    this.pending.set(true);
    this.memberships
      .update(membership.id, {
        name: raw.name.trim(),
        phone: raw.phone.trim() || null,
        address: raw.address.trim() || null,
        ...(this.isOwnMembership() ? {} : { role: raw.role, isActive: raw.isActive }),
      })
      .subscribe({
        next: () => void this.router.navigateByUrl('/settings/users'),
        error: () => {
          this.pending.set(false);
          this.error.set('No pudimos guardar los cambios.');
        },
        complete: () => this.pending.set(false),
      });
  }

  openReset(): void {
    this.resetForm.controls.temporaryPassword.setValue(createTemporaryPassword());
    this.resetCredentials.set(null);
    this.resetError.set(null);
    this.copied.set(false);
    this.resetOpen.set(true);
  }

  closeReset(): void {
    this.resetOpen.set(false);
    this.resetCredentials.set(null);
    this.resetForm.reset();
  }

  generateResetPassword(): void {
    this.resetForm.controls.temporaryPassword.setValue(createTemporaryPassword());
  }

  resetPassword(): void {
    const membership = this.membership();
    this.resetForm.markAllAsTouched();
    if (!membership || this.resetForm.invalid) {
      return;
    }

    const password = this.resetForm.controls.temporaryPassword.value;
    this.resetPending.set(true);
    this.memberships.resetPassword(membership.id, password).subscribe({
      next: () => {
        this.resetCredentials.set(password);
        this.resetForm.reset();
      },
      error: () => {
        this.resetPending.set(false);
        this.resetError.set('No pudimos restablecer la contraseña.');
      },
      complete: () => this.resetPending.set(false),
    });
  }

  async copyPassword(password: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(password);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
