import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppNavigationComponent } from '@core/components/app-navigation/app-navigation';
import { AuthService } from '@core/services/auth/auth';
import { AppIconSpriteComponent } from '@shared/components/app-icon-sprite/app-icon-sprite';

@Component({
  selector: 'app-layout',
  imports: [AppIconSpriteComponent, AppNavigationComponent, RouterOutlet],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly workshopName = computed(() => this.auth.activeWorkshop()?.name ?? 'Your workshop');
  readonly workshopRole = computed(() => this.auth.activeWorkshop()?.role ?? 'TEAM MEMBER');
  readonly workshopInitial = computed(() => this.workshopName().slice(0, 1).toUpperCase());

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
