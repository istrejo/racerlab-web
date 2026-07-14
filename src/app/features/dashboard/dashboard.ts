import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-dashboard',
  template: `
    <main class="min-h-dvh bg-slate-50 p-6 text-slate-900 sm:p-10">
      <section
        class="mx-auto flex max-w-5xl items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <p class="text-sm font-semibold text-[#F97316]">Workshop operations</p>
          <h1 class="mt-2 font-[Manrope,ui-sans-serif] text-3xl font-bold">Dashboard</h1>
          <p class="mt-2 text-slate-600">Your authenticated workspace is ready.</p>
        </div>
        <button
          class="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004AC6] focus-visible:ring-offset-2"
          (click)="logout()"
          type="button"
        >
          Sign out
        </button>
      </section>
    </main>
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
