import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { sanitizeReturnUrl } from '@core/services/auth/auth-navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  returnToLogin(): void {
    if (this.router.url.split(/[?#]/, 1)[0] === '/login') {
      this.auth.dismissSessionExpired();
      return;
    }

    const returnUrl = sanitizeReturnUrl(this.router.url) ?? '/dashboard';
    void this.router.navigate(['/login'], { queryParams: { returnUrl } }).then((navigated) => {
      if (navigated) {
        this.auth.dismissSessionExpired();
      }
    });
  }
}
