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
    loadComponent: () => import('./features/auth/login/login'),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signup/signup'),
  },
  {
    path: 'workshops/select',
    canActivate: [authGuard],
    loadComponent: () => import('./features/workshops/workshop-select/workshop-select'),
  },
  {
    path: 'workshops/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/workshops/workshop-new/workshop-new'),
  },
  {
    path: 'change-password',
    canActivate: [authGuard, passwordChangeGuard],
    loadComponent: () => import('./features/auth/change-password/change-password'),
  },
  {
    path: '',
    canActivateChild: [authGuard, workshopGuard],
    loadComponent: () => import('./layout/layout'),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard/dashboard'),
      },
      {
        path: 'customers',
        canActivate: [customerReadGuard],
        loadComponent: () => import('./features/customers/customer-list/customer-list'),
      },
      {
        path: 'customers/new',
        canActivate: [customerWriteGuard],
        loadComponent: () => import('./features/customers/customer-new/customer-new'),
      },
      {
        path: 'customers/:id/edit',
        canActivate: [customerWriteGuard],
        loadComponent: () => import('./features/customers/customer-edit/customer-edit'),
      },
      {
        path: 'customers/:id',
        canActivate: [customerReadGuard],
        loadComponent: () => import('./features/customers/customer-detail/customer-detail'),
      },
      {
        path: 'customers/:customerId/vehicles/new',
        canActivate: [vehicleWriteGuard],
        loadComponent: () => import('./features/vehicles/vehicle-new/vehicle-new'),
      },
      {
        path: 'customers/:customerId/vehicles/:vehicleId/edit',
        canActivate: [vehicleWriteGuard],
        loadComponent: () => import('./features/vehicles/vehicle-edit/vehicle-edit'),
      },
      {
        path: 'customers/:customerId/vehicles/:vehicleId',
        canActivate: [vehicleReadGuard],
        loadComponent: () => import('./features/vehicles/vehicle-detail/vehicle-detail'),
      },
      {
        path: 'vehicles',
        canActivate: [vehicleReadGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicle-workshop-list/vehicle-workshop-list'),
      },
      {
        path: 'customers/:customerId/vehicles',
        canActivate: [vehicleReadGuard],
        loadComponent: () => import('./features/vehicles/vehicle-list/vehicle-list'),
      },
      {
        path: 'service-orders',
        canActivate: [serviceOrderReadGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-list/service-order-list'),
      },
      {
        path: 'service-orders/new',
        canActivate: [serviceOrderWriteGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-new/service-order-new'),
      },
      {
        path: 'service-orders/:orderId/quotes/new',
        canActivate: [quoteWriteGuard],
        loadComponent: () => import('./features/quotes/quote-new/quote-new'),
      },
      {
        path: 'service-orders/:orderId/quotes/:quoteId',
        canActivate: [quoteReadGuard],
        loadComponent: () => import('./features/quotes/quote-detail/quote-detail'),
      },
      {
        path: 'service-orders/:orderId',
        canActivate: [serviceOrderReadGuard],
        loadComponent: () =>
          import('./features/service-orders/service-order-detail/service-order-detail'),
      },
      {
        path: 'quotes',
        canActivate: [quoteReadGuard],
        loadComponent: () => import('./features/quotes/quote-list/quote-list'),
      },
      {
        path: 'settings/users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/settings/users/user-list/user-list'),
      },
      {
        path: 'settings/users/new',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/settings/users/user-new/user-new'),
      },
      {
        path: 'settings/users/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/settings/users/user-edit/user-edit'),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
