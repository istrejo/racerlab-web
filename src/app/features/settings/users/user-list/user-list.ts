import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Membership } from '@core/models/membership.interface';
import { MembershipsService, roleLabel } from '@core/services/memberships/memberships';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-user-list',
  imports: [LoadingSkeletonComponent, RouterLink],
  templateUrl: './user-list.html',
})
export default class UserListComponent {
  private readonly membershipsService = inject(MembershipsService);

  readonly memberships = signal<Membership[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly labelFor = roleLabel;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.membershipsService.list().subscribe({
      next: (memberships) => this.memberships.set(memberships),
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar los usuarios del taller.');
      },
      complete: () => this.loading.set(false),
    });
  }
}
