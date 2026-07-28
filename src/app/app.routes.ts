import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin-guard';
import { authGuard } from '@core/guards/auth-guard';
import { passwordChangeGuard } from '@core/guards/password-change-guard';
import { workshopGuard } from '@core/guards/workshop-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((component) => component.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup').then((component) => component.SignupComponent),
  },
  {
    path: 'workshops/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workshops/workshop-new/workshop-new').then(
        (component) => component.WorkshopNewComponent,
      ),
  },
  {
    path: 'change-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password').then(
        (component) => component.ChangePasswordComponent,
      ),
  },
  {
    path: '',
    canActivateChild: [authGuard, workshopGuard],
    loadComponent: () =>
      import('./layout/layout').then((component) => component.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then(
            (component) => component.DashboardComponent,
          ),
      },
      {
        path: 'settings/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/settings/users/user-list/user-list').then(
            (component) => component.UserListComponent,
          ),
      },
      {
        path: 'settings/users/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/settings/users/user-new/user-new').then(
            (component) => component.UserNewComponent,
          ),
      },
      {
        path: 'settings/users/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/settings/users/user-edit/user-edit').then(
            (component) => component.UserEditComponent,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
