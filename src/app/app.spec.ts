import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth/auth';
import { vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  const sessionState = signal<'idle' | 'restoring'>('idle');
  const sessionExpired = signal(false);
  const sessionClosed = signal(false);
  const dismissSessionExpired = vi.fn(() => sessionExpired.set(false));

  beforeEach(async () => {
    sessionState.set('idle');
    sessionExpired.set(false);
    sessionClosed.set(false);
    dismissSessionExpired.mockClear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { sessionState, sessionExpired, sessionClosed, dismissSessionExpired },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the route outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('renders a visible session splash while a private route is restoring', () => {
    sessionState.set('restoring');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recuperando tu sesión');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
  });

  it('shows and dismisses the expired-session modal over the login route', () => {
    sessionExpired.set(true);
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { configurable: true, value: '/customers/42' });
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal.textContent).toContain('Tu sesión expiró');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();

    modal.querySelector<HTMLButtonElement>('button')?.click();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/customers/42' },
    });
  });

  it('keeps the modal open when navigation to login fails', async () => {
    sessionExpired.set(true);
    const fixture = TestBed.createComponent(App);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(false);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[role="dialog"] button')
      ?.click();
    await fixture.whenStable();

    expect(dismissSessionExpired).not.toHaveBeenCalled();
  });

  it('dismisses the modal immediately when login is already active', () => {
    sessionExpired.set(true);
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', {
      configurable: true,
      value: '/login?returnUrl=%2Fdashboard',
    });
    const navigate = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[role="dialog"] button')
      ?.click();

    expect(navigate).not.toHaveBeenCalled();
    expect(dismissSessionExpired).toHaveBeenCalledOnce();
  });

  it('uses distinct copy when another tab logs out', () => {
    sessionClosed.set(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu sesión fue cerrada');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
  });
});
