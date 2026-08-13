import { authGuard } from '@core/guards/auth-guard';
import { customerReadGuard } from '@core/guards/customer-read-guard';
import { customerWriteGuard } from '@core/guards/customer-write-guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('keeps signup public and workshop routes authenticated', () => {
    const signupRoute = routes.find((route) => route.path === 'signup');
    const workshopRoute = routes.find((route) => route.path === 'workshops/new');
    const selectorRoute = routes.find((route) => route.path === 'workshops/select');

    expect(signupRoute?.canActivate).toBeUndefined();
    expect(workshopRoute?.canActivate).toContain(authGuard);
    expect(selectorRoute?.canActivate).toContain(authGuard);
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
