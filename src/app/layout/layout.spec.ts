import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { PermissionsService } from '@core/services/permissions/permissions';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { LayoutComponent } from './layout';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  const logout = vi.fn(() => of(undefined));
  const canReadCustomers = signal(true);

  beforeEach(async () => {
    logout.mockReset();
    logout.mockReturnValue(of(undefined));
    canReadCustomers.set(true);

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            activeWorkshop: signal({
              workshopId: 'workshop-1',
              membershipId: 'membership-1',
              name: 'Racer Lab Norte',
              role: 'OWNER',
            }),
            user: signal({ id: 'user-1', name: 'Ada Lovelace', email: 'ada@racerlab.test' }),
            profileState: signal('ready'),
            logout,
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            canManageUsers: () => false,
            canReadCustomers,
            canReadOrders: () => true,
            canWriteOrders: () => true,
            canReadVehicles: () => true,
            canReadQuotes: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows customer navigation only when the active role can read customers', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Customers');

    canReadCustomers.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Customers');
  });

  it('renders an accessible collapsed navigation toggle', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="application-navigation"]',
    );
    const navigation = fixtureElement.querySelector<HTMLElement>('#application-navigation');

    expect(navigationToggle?.getAttribute('aria-label')).toBe('Toggle navigation');
    expect(navigationToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(navigation?.classList.contains('-translate-x-full')).toBe(true);
  });

  it('opens the navigation when the toggle is activated', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="application-navigation"]',
    );
    const navigation = fixtureElement.querySelector<HTMLElement>('#application-navigation');

    navigationToggle?.click();
    fixture.detectChanges();

    expect(navigationToggle?.getAttribute('aria-expanded')).toBe('true');
    expect(navigation?.classList.contains('translate-x-0')).toBe(true);
    expect(navigation?.classList.contains('-translate-x-full')).toBe(false);
  });

  it('closes the navigation when the backdrop is activated', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="application-navigation"]',
    );
    const navigationBackdrop = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Close navigation"]',
    );
    const navigation = fixtureElement.querySelector<HTMLElement>('#application-navigation');

    navigationToggle?.click();
    fixture.detectChanges();

    expect(navigationBackdrop?.classList.contains('pointer-events-auto')).toBe(true);
    expect(navigationBackdrop?.classList.contains('pointer-events-none')).toBe(false);

    navigationBackdrop?.click();
    fixture.detectChanges();

    expect(navigationToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(navigation?.classList.contains('-translate-x-full')).toBe(true);
    expect(navigationBackdrop?.getAttribute('tabindex')).toBe('-1');
  });

  it('opens the user menu from the avatar without logging out', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const profileTrigger = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="user-menu"]',
    );

    profileTrigger?.click();
    fixture.detectChanges();

    expect(profileTrigger?.getAttribute('aria-expanded')).toBe('true');
    expect(fixtureElement.querySelector('#user-menu')?.textContent).toContain('Ada Lovelace');
    expect(fixtureElement.querySelector('#user-menu')?.textContent).toContain('ada@racerlab.test');
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps workshop switching separate from logout', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const workshopSwitcher = fixtureElement.querySelector<HTMLAnchorElement>(
      'a[href="/workshops/select"]',
    );

    workshopSwitcher?.click();

    expect(workshopSwitcher?.textContent).toContain('Cambiar taller');
    expect(logout).not.toHaveBeenCalled();
  });

  it('logs out only from the explicit user-menu action', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixtureElement: HTMLElement = fixture.nativeElement;
    const profileTrigger = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="user-menu"]',
    );

    profileTrigger?.click();
    fixture.detectChanges();
    fixtureElement.querySelector<HTMLButtonElement>('[data-action="logout"]')?.click();

    expect(logout).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('keeps the menu visible and reports progress while logout is pending', () => {
    const logoutRequest = new Subject<undefined>();
    logout.mockReturnValueOnce(logoutRequest.asObservable());
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixtureElement: HTMLElement = fixture.nativeElement;
    const profileTrigger = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="user-menu"]',
    );

    profileTrigger?.click();
    fixture.detectChanges();
    fixtureElement.querySelector<HTMLButtonElement>('[data-action="logout"]')?.click();
    fixture.detectChanges();

    const logoutAction = fixtureElement.querySelector<HTMLButtonElement>('[data-action="logout"]');
    expect(fixtureElement.querySelector('#user-menu')).not.toBeNull();
    expect(logoutAction?.disabled).toBe(true);
    expect(logoutAction?.textContent).toContain('Cerrando sesión');
    expect(fixtureElement.querySelector('[data-loading="logout"]')).not.toBeNull();
    expect(navigateByUrl).not.toHaveBeenCalled();

    logoutRequest.next(undefined);
    logoutRequest.complete();

    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('closes the user menu with Escape and restores focus to the avatar', () => {
    fixture.detectChanges();
    const fixtureElement: HTMLElement = fixture.nativeElement;
    const profileTrigger = fixtureElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="user-menu"]',
    );

    profileTrigger?.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(profileTrigger?.getAttribute('aria-expanded')).toBe('false');
    expect(fixtureElement.querySelector('#user-menu')).toBeNull();
    expect(document.activeElement).toBe(profileTrigger);
  });
});
