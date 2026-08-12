import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth/auth';
import { SignupComponent } from './signup';

describe('SignupComponent', () => {
  const signup = vi.fn();
  const navigateByUrl = vi.fn(() => Promise.resolve(true));

  beforeEach(async () => {
    signup.mockReset();
    navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { signup, defaultAuthenticatedRoute: () => '/workshops/select' },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(navigateByUrl);
  });

  it('shows validation feedback without submitting an empty form', () => {
    const fixture = TestBed.createComponent(SignupComponent);

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(signup).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#signup-name-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#signup-email-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#signup-password-error')).not.toBeNull();
  });

  it('does not submit when password confirmation differs', () => {
    const fixture = TestBed.createComponent(SignupComponent);
    fixture.componentInstance.form.setValue({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
      confirmation: 'different123',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(signup).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('#signup-confirmation-error')?.textContent,
    ).toContain('deben coincidir');
  });

  it('creates the identity without sending confirmation and opens workshop selection', () => {
    signup.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(SignupComponent).componentInstance;
    component.form.setValue({
      name: '  Juan Pérez  ',
      email: 'juan@example.com',
      password: 'password123',
      confirmation: 'password123',
    });

    component.submit();

    expect(signup).toHaveBeenCalledWith({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/workshops/select');
    expect(component.pending()).toBe(false);
  });

  it('explains when the email is already registered', () => {
    signup.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
          }),
      ),
    );
    const fixture = TestBed.createComponent(SignupComponent);
    fixture.componentInstance.form.setValue({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
      confirmation: 'password123',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.pending()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Ya existe una cuenta',
    );
  });
});
