import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin-guard';
import { authGuard } from '@core/guards/auth-guard';
import { customerReadGuard } from '@core/guards/customer-read-guard';
import { customerWriteGuard } from '@core/guards/customer-write-guard';
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
    path: 'workshops/select',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workshops/workshop-select/workshop-select').then(
        (component) => component.WorkshopSelectComponent,
      ),
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
    loadComponent: () => import('./layout/layout').then((component) => component.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then(
            (component) => component.DashboardComponent,
          ),
      },
      {
        path: 'customers',
        canActivate: [customerReadGuard],
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list').then(
            (component) => component.CustomerListComponent,
          ),
      },
      {
        path: 'customers/new',
        canActivate: [customerWriteGuard],
        loadComponent: () =>
          import('./features/customers/customer-new/customer-new').then(
            (component) => component.CustomerNewComponent,
          ),
      },
      {
        path: 'customers/:id/edit',
        canActivate: [customerWriteGuard],
        loadComponent: () =>
          import('./features/customers/customer-edit/customer-edit').then(
            (component) => component.CustomerEditComponent,
          ),
      },
      {
        path: 'customers/:id',
        canActivate: [customerReadGuard],
        loadComponent: () =>
          import('./features/customers/customer-detail/customer-detail').then(
            (component) => component.CustomerDetailComponent,
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
