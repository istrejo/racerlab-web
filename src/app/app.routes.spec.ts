import { authGuard } from '@core/guards/auth-guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('keeps signup public and workshop creation authenticated', () => {
    const signupRoute = routes.find((route) => route.path === 'signup');
    const workshopRoute = routes.find((route) => route.path === 'workshops/new');

    expect(signupRoute?.canActivate).toBeUndefined();
    expect(workshopRoute?.canActivate).toContain(authGuard);
  });

  it('groups application routes inside the authenticated layout', () => {
    const applicationRoute = routes.find((route) => route.path === '' && route.children);

    expect(applicationRoute?.canActivateChild).toContain(authGuard);
    expect(applicationRoute?.children?.map((route) => route.path)).toContain('dashboard');
    expect(applicationRoute?.children?.map((route) => route.path)).toContain('settings/users');
  });
});
