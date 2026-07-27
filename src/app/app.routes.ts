import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin-guard';
import { authGuard } from '@core/guards/auth-guard';
import { passwordChangeGuard } from '@core/guards/password-change-guard';
import { workshopGuard } from '@core/guards/workshop-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login').then((component) => component.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup').then((component) => component.SignupComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, workshopGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((component) => component.DashboardComponent),
  },
  {
    path: 'workshops/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workshops/workshop-new').then(
        (component) => component.WorkshopNewComponent,
      ),
  },
  {
    path: 'change-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./features/auth/change-password').then(
        (component) => component.ChangePasswordComponent,
      ),
  },
  {
    path: 'settings/users',
    canActivate: [authGuard, workshopGuard, adminGuard],
    loadComponent: () =>
      import('./features/settings/users/user-list').then(
        (component) => component.UserListComponent,
      ),
  },
  {
    path: 'settings/users/new',
    canActivate: [authGuard, workshopGuard, adminGuard],
    loadComponent: () =>
      import('./features/settings/users/user-new').then((component) => component.UserNewComponent),
  },
  {
    path: 'settings/users/:id/edit',
    canActivate: [authGuard, workshopGuard, adminGuard],
    loadComponent: () =>
      import('./features/settings/users/user-edit').then(
        (component) => component.UserEditComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
