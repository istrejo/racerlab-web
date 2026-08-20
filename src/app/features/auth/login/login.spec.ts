import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth/auth';
import LoginComponent from './login';

describe('LoginComponent', () => {
  const login = vi.fn();
  const navigateByUrl = vi.fn(() => Promise.resolve(true));
  let defaultAuthenticatedRoute: string;
  let returnUrl: string | null;

  beforeEach(async () => {
    login.mockReset();
    defaultAuthenticatedRoute = '/dashboard';
    returnUrl = null;
    navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login,
            defaultAuthenticatedRoute: () => defaultAuthenticatedRoute,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } },
        },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).compileComponents();
  });

  it('shows validation feedback without submitting invalid credentials', () => {
    const fixture = TestBed.createComponent(LoginComponent);

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#email-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#password-error')).not.toBeNull();
  });

  it('submits valid credentials and redirects to the default authenticated route', () => {
    login.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'advisor@racerlab.test', password: 'password123' });

    component.submit();

    expect(login).toHaveBeenCalledWith({ email: 'advisor@racerlab.test', password: 'password123' });
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.pending()).toBe(false);
  });

  it('shows a server error when authentication fails', () => {
    login.mockReturnValue(throwError(() => new Error('Unauthorized')));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'advisor@racerlab.test', password: 'password123' });

    component.submit();
    fixture.detectChanges();

    expect(component.pending()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos iniciar sesión',
    );
  });

  it('redirects a temporary-password login to the mandatory change screen', () => {
    defaultAuthenticatedRoute = '/change-password';
    login.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'advisor@racerlab.test', password: 'password123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/change-password');
  });

  it('returns to a safe private route after login', () => {
    returnUrl = '/customers/42?tab=vehicles';
    login.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'advisor@racerlab.test', password: 'password123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/customers/42?tab=vehicles');
  });

  it('ignores external return URLs', () => {
    returnUrl = '//malicious.example/path';
    login.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'advisor@racerlab.test', password: 'password123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects a login without workshop context to workshop creation', () => {
    defaultAuthenticatedRoute = '/workshops/new';
    login.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'owner@racerlab.test', password: 'password123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/workshops/new');
  });

  it('shows a visible signup action on the login screen', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
    );
    const link = links.find((candidate) => candidate.textContent?.includes('Crear cuenta'));

    expect(link).toBeDefined();
  });
});
