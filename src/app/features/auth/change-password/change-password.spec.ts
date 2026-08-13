import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth/auth';
import { ChangePasswordComponent } from './change-password';

describe('ChangePasswordComponent', () => {
  const changePassword = vi.fn();
  const navigateByUrl = vi.fn(() => Promise.resolve(true));
  let defaultAuthenticatedRoute: string;

  beforeEach(async () => {
    changePassword.mockReset();
    defaultAuthenticatedRoute = '/dashboard';
    navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            changePassword,
            defaultAuthenticatedRoute: () => defaultAuthenticatedRoute,
          },
        },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
  });

  it('rejects mismatched confirmation without calling the API', () => {
    const component = TestBed.createComponent(ChangePasswordComponent).componentInstance;
    component.form.setValue({
      currentPassword: 'temporary-password',
      newPassword: 'new-password',
      confirmation: 'other-password',
    });

    component.submit();

    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and continues to the dashboard', () => {
    changePassword.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(ChangePasswordComponent).componentInstance;
    component.form.setValue({
      currentPassword: 'temporary-password',
      newPassword: 'new-password',
      confirmation: 'new-password',
    });

    component.submit();

    expect(changePassword).toHaveBeenCalledWith('temporary-password', 'new-password');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('continues to workshop creation when no workshop is active', () => {
    defaultAuthenticatedRoute = '/workshops/new';
    changePassword.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(ChangePasswordComponent).componentInstance;
    component.form.setValue({
      currentPassword: 'temporary-password',
      newPassword: 'new-password',
      confirmation: 'new-password',
    });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/workshops/new');
  });
});
