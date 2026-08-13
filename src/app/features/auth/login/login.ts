import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination } from '@core/services/auth/auth-navigation';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
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
      next: () =>
        void this.router.navigateByUrl(
          authenticatedDestination(this.auth, this.route.snapshot.queryParamMap.get('returnUrl')),
        ),
      error: () => {
        this.pending.set(false);
        this.serverError.set(
          'No pudimos iniciar sesión. Revisá tus credenciales e intentá nuevamente.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
