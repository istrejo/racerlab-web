import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-application-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-navigation.html',
})
export class AppNavigationComponent {
  readonly auth = inject(AuthService);
}
