import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination, sanitizeReturnUrl } from '@core/services/auth/auth-navigation';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly pending = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    ],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmation: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  passwordsMatch(): boolean {
    return this.form.controls.newPassword.value === this.form.controls.confirmation.value;
  }

  submit(): void {
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.passwordsMatch()) {
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.pending.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () =>
        void this.router.navigateByUrl(
          authenticatedDestination(
            this.auth,
            sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
          ),
        ),
      error: () => {
        this.pending.set(false);
        this.serverError.set(
          'No pudimos cambiar la contraseña. Revisá la clave temporal e intentá nuevamente.',
        );
      },
      complete: () => this.pending.set(false),
    });
  }
}
