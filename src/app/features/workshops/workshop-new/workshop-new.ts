import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination, sanitizeReturnUrl } from '@core/services/auth/auth-navigation';
import { WorkshopsService } from '@core/services/workshops/workshops';

@Component({
  selector: 'app-workshop-new',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './workshop-new.html',
})
export class WorkshopNewComponent {
  readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workshops = inject(WorkshopsService);

  readonly pending = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  nameError(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.form.controls.name.value.trim()) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.pending.set(true);
    this.workshops.create({ name: this.form.controls.name.value.trim() }).subscribe({
      next: () =>
        void this.router.navigateByUrl(
          authenticatedDestination(
            this.auth,
            sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
          ),
        ),
      error: () => {
        this.pending.set(false);
        this.serverError.set('No pudimos crear el taller. Intentá nuevamente.');
      },
      complete: () => this.pending.set(false),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
