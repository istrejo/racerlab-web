import { convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth/auth';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  const login = vi.fn();
  const navigateByUrl = vi.fn(() => Promise.resolve(true));

  beforeEach(async () => {
    login.mockReset();
    navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: { login } },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ returnUrl: 'https://invalid.test' }) },
          },
        },
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

  it('submits valid credentials and redirects only to the protected dashboard route', () => {
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
      'could not sign you in',
    );
  });
});
