import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { authenticatedDestination, sanitizeReturnUrl } from '@core/services/auth/auth-navigation';
import { WorkshopsService, WorkshopSummary } from '@core/services/workshops/workshops';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-workshop-select',
  imports: [LoadingSkeletonComponent, RouterLink],
  templateUrl: './workshop-select.html',
})
export default class WorkshopSelectComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workshopsService = inject(WorkshopsService);

  readonly workshops = signal<WorkshopSummary[]>([]);
  readonly loading = signal(true);
  readonly selectingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.workshopsService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (workshops) => {
          this.workshops.set(workshops);
          if (workshops.length === 0) {
            void this.router.navigate(['/workshops/new'], {
              queryParams: this.safeReturnUrl ? { returnUrl: this.safeReturnUrl } : undefined,
            });
          }
        },
        error: () => this.error.set('No pudimos cargar tus talleres. Intentá nuevamente.'),
      });
  }

  select(workshop: WorkshopSummary): void {
    if (this.selectingId()) {
      return;
    }

    if (workshop.id === this.auth.activeWorkshop()?.workshopId) {
      void this.navigateAfterSelection();
      return;
    }

    this.error.set(null);
    this.selectingId.set(workshop.id);
    this.workshopsService
      .select(workshop.id)
      .pipe(finalize(() => this.selectingId.set(null)))
      .subscribe({
        next: () => void this.navigateAfterSelection(),
        error: () => this.error.set('No pudimos cambiar de taller. Intentá nuevamente.'),
      });
  }

  private readonly safeReturnUrl = sanitizeReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  private navigateAfterSelection(): void {
    void this.router.navigateByUrl(authenticatedDestination(this.auth, this.safeReturnUrl));
  }
}
