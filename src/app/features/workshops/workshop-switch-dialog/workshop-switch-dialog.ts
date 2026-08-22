import { Component, inject, OnInit, output, signal } from '@angular/core';
import { WorkshopSummary } from '@core/models/workshop.interface';
import { AuthService } from '@core/services/auth/auth';
import { WorkshopsService } from '@core/services/workshops/workshops';
import { AppModalComponent } from '@shared/components/app-modal/app-modal';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-workshop-switch-dialog',
  imports: [AppModalComponent],
  templateUrl: './workshop-switch-dialog.html',
})
export class WorkshopSwitchDialogComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly workshopsService = inject(WorkshopsService);

  readonly closed = output<void>();
  readonly switched = output<void>();
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
        next: (workshops) => this.workshops.set(workshops),
        error: () => this.error.set('No pudimos cargar tus talleres. Intentá nuevamente.'),
      });
  }

  select(workshop: WorkshopSummary): void {
    if (this.selectingId() || workshop.id === this.auth.activeWorkshop()?.workshopId) return;

    this.error.set(null);
    this.selectingId.set(workshop.id);
    this.workshopsService
      .select(workshop.id)
      .pipe(finalize(() => this.selectingId.set(null)))
      .subscribe({
        next: () => this.switched.emit(),
        error: () => this.error.set('No pudimos cambiar de taller. Intentá nuevamente.'),
      });
  }
}
