import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly pending = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmation: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  nameError(): boolean {
    return this.shouldShowError('name');
  }

  emailError(): boolean {
    return this.shouldShowError('email');
  }

  passwordError(): boolean {
    return this.shouldShowError('password');
  }

  confirmationError(): boolean {
    const control = this.form.controls.confirmation;
    return (control.touched || control.dirty) && (control.invalid || !this.passwordsMatch());
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmation(): void {
    this.showConfirmation.update((visible) => !visible);
  }

  submit(): void {
    this.serverError.set(null);
    this.form.markAllAsTouched();

    const { name, email, password } = this.form.getRawValue();

    if (this.form.invalid || !name.trim() || !this.passwordsMatch()) {
      if (!name.trim()) {
        this.form.controls.name.setErrors({ required: true });
      }
      return;
    }

    this.pending.set(true);
    this.auth
      .signup({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: () => void this.router.navigateByUrl(this.auth.defaultAuthenticatedRoute()),
        error: (error: HttpErrorResponse) => {
          this.pending.set(false);
          this.serverError.set(
            error.status === 409
              ? 'Ya existe una cuenta con ese correo electrónico.'
              : 'No pudimos crear tu cuenta. Intentá nuevamente.',
          );
        },
        complete: () => this.pending.set(false),
      });
  }

  private passwordsMatch(): boolean {
    return this.form.controls.password.value === this.form.controls.confirmation.value;
  }

  private shouldShowError(controlName: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
