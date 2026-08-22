import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';

@Component({
  selector: 'app-application-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-navigation.html',
})
export class AppNavigationComponent {
  readonly permissions = inject(PermissionsService);
  readonly mobileNavigationOpen = input(false);
  readonly mobileNavigationDismissed = output<void>();
  readonly workshopChangeRequested = output<void>();
}
