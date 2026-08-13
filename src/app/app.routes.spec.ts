import { authGuard } from '@core/guards/auth-guard';
import { customerReadGuard } from '@core/guards/customer-read-guard';
import { customerWriteGuard } from '@core/guards/customer-write-guard';
import { guestGuard } from '@core/guards/guest-guard';
import { passwordChangeGuard } from '@core/guards/password-change-guard';
import { routes } from './app.routes';

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

  it('groups application routes inside the authenticated layout', () => {
    const applicationRoute = routes.find((route) => route.path === '' && route.children);

    expect(applicationRoute?.canActivateChild).toContain(authGuard);
    expect(applicationRoute?.children?.map((route) => route.path)).toContain('dashboard');
    expect(applicationRoute?.children?.map((route) => route.path)).toContain('settings/users');
  });

  it('protects customer reads and writes with their role guards', () => {
    const applicationRoute = routes.find((route) => route.path === '' && route.children);
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
