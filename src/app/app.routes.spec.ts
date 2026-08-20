import { authGuard } from '@core/guards/auth/auth-guard';
import { customerReadGuard } from '@core/guards/customer-read/customer-read-guard';
import { customerWriteGuard } from '@core/guards/customer-write/customer-write-guard';
import { guestGuard } from '@core/guards/guest/guest-guard';
import { passwordChangeGuard } from '@core/guards/password-change/password-change-guard';
import { workshopGuard } from '@core/guards/workshop/workshop-guard';
import { routes } from './app.routes';
import { LAYOUT_ROUTES } from './layout/layout.routes';

describe('application routes', () => {
  it('protects public auth routes with the guest guard and workshop routes with auth', () => {
    const loginRoute = routes.find((route) => route.path === 'login');
    const signupRoute = routes.find((route) => route.path === 'signup');
    const workshopRoute = routes.find((route) => route.path === 'workshops/new');
    const selectorRoute = routes.find((route) => route.path === 'workshops/select');

    expect(loginRoute?.canActivate).toEqual([guestGuard]);
    expect(signupRoute?.canActivate).toEqual([guestGuard]);
    expect(routes.some((route) => route.path === 'session-unavailable')).toBe(false);
    expect(workshopRoute?.canActivate).toContain(authGuard);
    expect(selectorRoute?.canActivate).toContain(authGuard);
  });

  it('restores authentication before evaluating password-change requirements', () => {
    const passwordRoute = routes.find((route) => route.path === 'change-password');
    expect(passwordRoute?.canActivate).toEqual([authGuard, passwordChangeGuard]);
  });

  it('lazily loads the authenticated layout guarded by auth and workshop guards', () => {
    const applicationRoute = routes.find((route) => route.path === '' && route.loadChildren);

    expect(applicationRoute?.canActivateChild).toContain(authGuard);
    expect(applicationRoute?.canActivateChild).toContain(workshopGuard);
    expect(applicationRoute?.loadChildren).toBeInstanceOf(Function);
  });

  it('groups application routes inside the authenticated layout', () => {
    const applicationRoute = LAYOUT_ROUTES.find((route) => route.path === '' && route.children);

    expect(applicationRoute?.children?.map((route) => route.path)).toContain('dashboard');
    expect(applicationRoute?.children?.map((route) => route.path)).toContain('settings/users');
  });

  it('protects customer reads and writes with their role guards', () => {
    const applicationRoute = LAYOUT_ROUTES.find((route) => route.path === '' && route.children);
    const customers = applicationRoute?.children ?? [];

    expect(customers.find((route) => route.path === 'customers')?.canActivate).toContain(
      customerReadGuard,
    );
    expect(customers.find((route) => route.path === 'customers/:id')?.canActivate).toContain(
      customerReadGuard,
    );
    expect(customers.find((route) => route.path === 'customers/new')?.canActivate).toContain(
      customerWriteGuard,
    );
    expect(customers.find((route) => route.path === 'customers/:id/edit')?.canActivate).toContain(
      customerWriteGuard,
    );
  });
});
