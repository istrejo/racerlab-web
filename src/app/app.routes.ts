import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin/admin-guard';
import { authGuard } from '@core/guards/auth/auth-guard';
import { customerReadGuard } from '@core/guards/customer-read/customer-read-guard';
import { customerWriteGuard } from '@core/guards/customer-write/customer-write-guard';
import { guestGuard } from '@core/guards/guest/guest-guard';
import { passwordChangeGuard } from '@core/guards/password-change/password-change-guard';
import { quoteReadGuard } from '@core/guards/quote-read/quote-read-guard';
import { quoteWriteGuard } from '@core/guards/quote-write/quote-write-guard';
import { serviceOrderReadGuard } from '@core/guards/service-order-read/service-order-read-guard';
import { serviceOrderWriteGuard } from '@core/guards/service-order-write/service-order-write-guard';
import { vehicleReadGuard } from '@core/guards/vehicle-read/vehicle-read-guard';
import { vehicleWriteGuard } from '@core/guards/vehicle-write/vehicle-write-guard';
import { workshopGuard } from '@core/guards/workshop/workshop-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then((component) => component.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
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
    canActivate: [authGuard, passwordChangeGuard],
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
        path: 'customers/:customerId/vehicles/new',
        canActivate: [vehicleWriteGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-new/vehicle-new').then((m) => m.VehicleNewComponent),
      },
      {
        path: 'customers/:customerId/vehicles/:vehicleId/edit',
        canActivate: [vehicleWriteGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-edit/vehicle-edit').then(
            (m) => m.VehicleEditComponent,
          ),
      },
      {
        path: 'customers/:customerId/vehicles/:vehicleId',
        canActivate: [vehicleReadGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-detail/vehicle-detail').then(
            (m) => m.VehicleDetailComponent,
          ),
      },
      {
        path: 'vehicles',
        canActivate: [vehicleReadGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-workshop-list/vehicle-workshop-list').then(
            (m) => m.VehicleWorkshopListComponent,
          ),
      },
      {
        path: 'customers/:customerId/vehicles',
        canActivate: [vehicleReadGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-list/vehicle-list').then(
            (m) => m.VehicleListComponent,
          ),
      },
      {
        path: 'service-orders',
        canActivate: [serviceOrderReadGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-list/service-order-list').then(
            (m) => m.ServiceOrderListComponent,
          ),
      },
      {
        path: 'service-orders/new',
        canActivate: [serviceOrderWriteGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-new/service-order-new').then(
            (m) => m.ServiceOrderNewComponent,
          ),
      },
      {
        path: 'service-orders/:orderId/quotes/new',
        canActivate: [quoteWriteGuard],
        loadComponent: () =>
          import('./features/quotes/quote-new/quote-new').then((m) => m.QuoteNewComponent),
      },
      {
        path: 'service-orders/:orderId/quotes/:quoteId',
        canActivate: [quoteReadGuard],
        loadComponent: () =>
          import('./features/quotes/quote-detail/quote-detail').then((m) => m.QuoteDetailComponent),
      },
      {
        path: 'service-orders/:orderId',
        canActivate: [serviceOrderReadGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-detail/service-order-detail').then(
            (m) => m.ServiceOrderDetailComponent,
          ),
      },
      {
        path: 'quotes',
        canActivate: [quoteReadGuard],
        loadComponent: () =>
          import('./features/quotes/quote-list/quote-list').then((m) => m.QuoteListComponent),
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
