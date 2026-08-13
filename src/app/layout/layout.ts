import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppNavigationComponent } from '@core/components/app-navigation/app-navigation';
import { AuthService } from '@core/services/auth/auth';
import { AppIconSpriteComponent } from '@shared/components/app-icon-sprite/app-icon-sprite';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [AppIconSpriteComponent, AppNavigationComponent, RouterOutlet],
  templateUrl: './layout.html',
  host: {
    '(document:click)': 'closeUserMenuFromDocument($event)',
    '(document:keydown.escape)': 'closeUserMenuAndRestoreFocus()',
  },
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userMenuTrigger = viewChild<ElementRef<HTMLButtonElement>>('userMenuTrigger');
  readonly workshopName = computed(() => this.auth.activeWorkshop()?.name ?? 'Your workshop');
  readonly workshopRole = computed(() => this.auth.activeWorkshop()?.role ?? 'TEAM MEMBER');
  readonly userName = computed(() => this.auth.user()?.name ?? 'Usuario');
  readonly userEmail = computed(() => this.auth.user()?.email ?? '');
  readonly userInitial = computed(() => this.userName().trim().slice(0, 1).toUpperCase() || '?');
  readonly mobileNavigationOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly logoutPending = signal(false);

  toggleMobileNavigation(): void {
    this.mobileNavigationOpen.update((isOpen) => !isOpen);
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  toggleUserMenu(): void {
    if (this.logoutPending()) {
      return;
    }

    this.userMenuOpen.update((isOpen) => !isOpen);
  }

  closeUserMenu(): void {
    if (this.logoutPending()) {
      return;
    }

    this.userMenuOpen.set(false);
  }

  closeUserMenuFromDocument(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-user-menu]')) {
      return;
    }

    this.closeUserMenu();
  }

  closeUserMenuAndRestoreFocus(): void {
    if (!this.userMenuOpen() || this.logoutPending()) {
      return;
    }

    this.closeUserMenu();
    this.userMenuTrigger()?.nativeElement.focus();
  }

  logout(): void {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.logoutPending.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: () => void this.router.navigateByUrl('/login'),
      });
  }
}
