import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Membership, MembershipsService, roleLabel } from '@core/services/memberships/memberships';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink],
  templateUrl: './user-list.html',
})
export class UserListComponent {
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
