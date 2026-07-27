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
  template: `
    <main class="min-h-dvh bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <section class="mx-auto max-w-3xl" aria-labelledby="new-user-title">
        <a
          class="text-sm font-semibold text-[#004AC6] hover:underline"
          routerLink="/settings/users"
        >
          ← Volver a usuarios
        </a>

        @if (credentials(); as created) {
          <div class="mt-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
            <p class="font-semibold text-emerald-700">Usuario creado correctamente</p>
            <h1 id="new-user-title" class="mt-2 text-2xl font-bold">Compartí estas credenciales</h1>
            <p class="mt-2 text-sm text-slate-600">
              Se muestran una sola vez y no se guardan en el navegador.
            </p>
            <dl class="mt-6 space-y-4 rounded-xl bg-slate-100 p-5">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</dt>
                <dd class="mt-1 font-semibold">{{ created.name }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo</dt>
                <dd class="mt-1 break-all font-mono">{{ created.email }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contraseña temporal
                </dt>
                <dd class="mt-1 break-all font-mono">{{ created.password }}</dd>
              </div>
            </dl>
            <div class="mt-6 flex flex-wrap gap-3">
              <button
                class="h-11 rounded-lg bg-[#004AC6] px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004AC6] focus-visible:ring-offset-2"
                (click)="copyCredentials(created)"
                type="button"
              >
                {{ copied() ? 'Credenciales copiadas' : 'Copiar credenciales' }}
              </button>
              <a
                class="flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"
                routerLink="/settings/users"
              >
                Finalizar
              </a>
            </div>
          </div>
        } @else {
          <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p class="text-sm font-semibold text-[#F97316]">Alta manual</p>
            <h1 id="new-user-title" class="mt-2 text-2xl font-bold">Crear usuario</h1>
            <p class="mt-2 text-sm text-slate-600">
              El usuario deberá reemplazar la contraseña temporal en su primer acceso.
            </p>

            @if (serverError()) {
              <p
                class="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {{ serverError() }}
              </p>
            }

            <form
              class="mt-6 grid gap-5 sm:grid-cols-2"
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
            >
              <div class="sm:col-span-2">
                <label class="mb-2 block text-sm font-semibold" for="name">Nombre completo</label>
                <input class="field" formControlName="name" id="name" autocomplete="name" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-2 block text-sm font-semibold" for="email"
                  >Correo electrónico</label
                >
                <input
                  class="field"
                  formControlName="email"
                  id="email"
                  autocomplete="email"
                  type="email"
                />
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
                <label class="mb-2 block text-sm font-semibold" for="password">
                  Contraseña temporal
                </label>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input
                    class="field flex-1 font-mono"
                    aria-describedby="password-help"
                    formControlName="password"
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                  />
                  <button
                    class="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"
                    (click)="generatePassword()"
                    type="button"
                  >
                    Generar
                  </button>
                  <button
                    class="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"
                    (click)="showPassword.update((show) => !show)"
                    type="button"
                  >
                    {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <p id="password-help" class="mt-2 text-xs text-slate-500">
                  Entre 8 y 128 caracteres.
                </p>
              </div>
              <div
                class="sm:col-span-2 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5"
              >
                <a
                  class="flex h-11 items-center px-4 text-sm font-semibold text-slate-700"
                  routerLink="/settings/users"
                >
                  Cancelar
                </a>
                <button
                  class="h-11 rounded-lg bg-[#004AC6] px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                  [disabled]="pending()"
                  type="submit"
                >
                  {{ pending() ? 'Creando...' : 'Crear usuario' }}
                </button>
              </div>
            </form>
          </div>
        }
      </section>
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
export class UserNewComponent {
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
