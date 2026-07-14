import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <section class="w-full max-w-md" aria-labelledby="login-title">
        <div class="mb-6 flex items-center justify-center gap-2" aria-label="Racer Lab">
          <svg aria-hidden="true" class="size-8 text-[#004AC6]" viewBox="0 0 32 32" fill="none">
            <path
              d="M5 19.5h22l-2.4-7.2a3 3 0 0 0-2.85-2.05h-11.5a3 3 0 0 0-2.85 2.05L5 19.5Z"
              fill="currentColor"
            />
            <path
              d="M7.5 19.5v2.25A2.25 2.25 0 0 0 9.75 24h1.5a2.25 2.25 0 0 0 2.25-2.25V19.5m5.25 0v2.25A2.25 2.25 0 0 0 21 24h1.5a2.25 2.25 0 0 0 2.25-2.25V19.5"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle cx="10.5" cy="18.25" r="1.25" fill="white" />
            <circle cx="21.5" cy="18.25" r="1.25" fill="white" />
          </svg>
          <span class="font-[Manrope,ui-sans-serif] text-2xl font-bold tracking-tight"
            >Racer Lab</span
          >
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <header class="mb-6 text-center">
            <h1 id="login-title" class="font-[Manrope,ui-sans-serif] text-xl font-semibold">
              Sign in
            </h1>
            <p class="mt-1 text-sm text-slate-600">Access your workshop dashboard</p>
          </header>

          @if (serverError()) {
            <div
              class="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {{ serverError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="space-y-5">
              <div>
                <label class="mb-2 block text-sm font-semibold" for="email">Email address</label>
                <input
                  class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100"
                  [attr.aria-describedby]="emailError() ? 'email-error' : null"
                  [attr.aria-invalid]="emailError()"
                  autocomplete="email"
                  formControlName="email"
                  id="email"
                  inputmode="email"
                  placeholder="mechanic@racerlab.com"
                  type="email"
                />
                @if (emailError()) {
                  <p class="mt-2 text-sm text-red-700" id="email-error">
                    Enter a valid email address.
                  </p>
                }
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold" for="password">Password</label>
                <div class="relative">
                  <input
                    class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100"
                    [attr.aria-describedby]="passwordError() ? 'password-error' : null"
                    [attr.aria-invalid]="passwordError()"
                    autocomplete="current-password"
                    formControlName="password"
                    id="password"
                    placeholder="Enter your password"
                    [type]="showPassword() ? 'text' : 'password'"
                  />
                  <button
                    class="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-[#004AC6] underline decoration-transparent underline-offset-2 hover:decoration-current focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004AC6]"
                    (click)="togglePassword()"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                    type="button"
                  >
                    {{ showPassword() ? 'Hide' : 'Show' }}
                  </button>
                </div>
                @if (passwordError()) {
                  <p class="mt-2 text-sm text-red-700" id="password-error">
                    Password must be at least 8 characters.
                  </p>
                }
              </div>

              <button
                class="flex h-11 w-full items-center justify-center rounded-lg bg-[#004AC6] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004AC6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                [disabled]="pending()"
                type="submit"
              >
                {{ pending() ? 'Signing in...' : 'Sign in' }}
              </button>
            </div>
          </form>

          <p class="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
            Need an account? Contact your workshop administrator.
          </p>
        </div>
      </section>
    </main>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pending = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  emailError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.touched || control.dirty);
  }

  passwordError(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (control.touched || control.dirty);
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  submit(): void {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: () => {
        this.pending.set(false);
        this.serverError.set('We could not sign you in. Check your credentials and try again.');
      },
      complete: () => this.pending.set(false),
    });
  }

  private returnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl === '/dashboard') {
      return returnUrl;
    }

    return '/dashboard';
  }
}
