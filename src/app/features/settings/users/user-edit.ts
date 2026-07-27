import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import {
  assignableRoles,
  Membership,
  MembershipsService,
  roleLabel,
} from '@core/services/memberships/memberships';
import { createTemporaryPassword } from './user-new';

@Component({
  selector: 'app-user-edit',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-dvh bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <section class="mx-auto max-w-3xl" aria-labelledby="edit-user-title">
        <a
          class="text-sm font-semibold text-[#004AC6] hover:underline"
          routerLink="/settings/users"
        >
          ← Volver a usuarios
        </a>

        <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p class="text-sm font-semibold text-[#F97316]">Configuración</p>
          <h1 id="edit-user-title" class="mt-2 text-2xl font-bold">Editar usuario</h1>

          @if (loading()) {
            <p class="mt-6 text-slate-600" aria-live="polite">Cargando perfil...</p>
          } @else if (error()) {
            <p
              class="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800"
              role="alert"
            >
              {{ error() }}
            </p>
          } @else if (membership(); as current) {
            @if (current.role === 'OWNER') {
              <p class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                La cuenta propietaria está protegida. Su titularidad solo puede cambiarse mediante
                transferencia.
              </p>
            } @else {
              <form
                class="mt-6 grid gap-5 sm:grid-cols-2"
                [formGroup]="form"
                (ngSubmit)="save()"
                novalidate
              >
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-semibold" for="name">Nombre completo</label>
                  <input class="field" formControlName="name" id="name" autocomplete="name" />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-semibold" for="email">
                    Correo electrónico
                  </label>
                  <input
                    class="field bg-slate-100 text-slate-600"
                    [value]="current.user.email"
                    id="email"
                    disabled
                  />
                  <p class="mt-2 text-xs text-slate-500">El correo no puede modificarse.</p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold" for="phone">Teléfono</label>
                  <input class="field" formControlName="phone" id="phone" autocomplete="tel" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold" for="role">Tipo de usuario</label>
                  <select class="field" formControlName="role" id="role">
                    @for (role of roles; track role) {
                      <option [value]="role">{{ labelFor(role) }}</option>
                    }
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-semibold" for="address">Dirección</label>
                  <input
                    class="field"
                    formControlName="address"
                    id="address"
                    autocomplete="street-address"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="flex items-center gap-3 text-sm font-semibold">
                    <input
                      class="size-4 accent-[#004AC6]"
                      formControlName="isActive"
                      type="checkbox"
                    />
                    Usuario activo
                  </label>
                  @if (isOwnMembership()) {
                    <p class="mt-2 text-xs text-slate-500">
                      No podés cambiar tu propio rol ni desactivar tu acceso.
                    </p>
                  }
                </div>

                <div
                  class="sm:col-span-2 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5"
                >
                  <button
                    class="h-11 rounded-lg border border-amber-300 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                    [disabled]="isOwnMembership()"
                    (click)="openReset()"
                    type="button"
                  >
                    Restablecer contraseña
                  </button>
                  <div class="flex gap-3">
                    <a
                      class="flex h-11 items-center px-4 text-sm font-semibold"
                      routerLink="/settings/users"
                    >
                      Cancelar
                    </a>
                    <button
                      class="h-11 rounded-lg bg-[#004AC6] px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                      [disabled]="pending()"
                      type="submit"
                    >
                      {{ pending() ? 'Guardando...' : 'Guardar cambios' }}
                    </button>
                  </div>
                </div>
              </form>
            }
          }
        </div>
      </section>

      @if (resetOpen() && membership(); as current) {
        <div class="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            aria-labelledby="reset-title"
            aria-modal="true"
            role="dialog"
          >
            <h2 id="reset-title" class="text-xl font-bold">Restablecer contraseña</h2>
            @if (resetCredentials(); as password) {
              <p class="mt-3 text-sm text-slate-600">
                Compartí esta clave con {{ current.name }}. Se muestra una sola vez.
              </p>
              <p class="mt-5 break-all rounded-lg bg-slate-100 p-4 font-mono">{{ password }}</p>
              <div class="mt-5 flex justify-end gap-3">
                <button
                  class="h-11 rounded-lg border border-slate-300 px-4 font-semibold"
                  (click)="copyPassword(password)"
                  type="button"
                >
                  {{ copied() ? 'Copiada' : 'Copiar clave' }}
                </button>
                <button
                  class="h-11 rounded-lg bg-[#004AC6] px-4 font-semibold text-white"
                  (click)="closeReset()"
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            } @else {
              <p class="mt-3 text-sm text-slate-600">
                Todas las sesiones de {{ current.name }} se cerrarán y deberá cambiar la nueva clave
                en el próximo acceso.
              </p>
              <form class="mt-5" [formGroup]="resetForm" (ngSubmit)="resetPassword()">
                <label class="mb-2 block text-sm font-semibold" for="temporary-password">
                  Nueva contraseña temporal
                </label>
                <div class="flex gap-2">
                  <input
                    class="field flex-1 font-mono"
                    formControlName="temporaryPassword"
                    id="temporary-password"
                    type="text"
                    autocomplete="new-password"
                  />
                  <button
                    class="rounded-lg border border-slate-300 px-3 font-semibold"
                    (click)="generateResetPassword()"
                    type="button"
                  >
                    Generar
                  </button>
                </div>
                @if (resetError()) {
                  <p class="mt-3 text-sm text-red-700" role="alert">{{ resetError() }}</p>
                }
                <div class="mt-5 flex justify-end gap-3">
                  <button class="h-11 px-4 font-semibold" (click)="closeReset()" type="button">
                    Cancelar
                  </button>
                  <button
                    class="h-11 rounded-lg bg-[#004AC6] px-4 font-semibold text-white disabled:bg-blue-400"
                    [disabled]="resetPending()"
                    type="submit"
                  >
                    {{ resetPending() ? 'Guardando...' : 'Restablecer' }}
                  </button>
                </div>
              </form>
            }
          </section>
        </div>
      }
    </main>
  `,
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
export class UserEditComponent {
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
