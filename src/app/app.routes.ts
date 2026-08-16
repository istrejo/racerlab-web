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
    path: '',
    canActivateChild: [authGuard, workshopGuard],
    loadChildren: () => import('./layout/layout.routes').then((m) => m.LAYOUT_ROUTES),
  },
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
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
