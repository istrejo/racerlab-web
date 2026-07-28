import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LayoutComponent } from './layout';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an accessible collapsed navigation toggle', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>('button[aria-controls="application-navigation"]');
    const navigation = fixtureElement.querySelector<HTMLElement>('#application-navigation');

    expect(navigationToggle?.getAttribute('aria-label')).toBe('Toggle navigation');
    expect(navigationToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(navigation?.classList.contains('-translate-x-full')).toBe(true);
  });

  it('opens the navigation when the toggle is activated', () => {
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>('button[aria-controls="application-navigation"]');
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
    const navigationToggle = fixtureElement.querySelector<HTMLButtonElement>('button[aria-controls="application-navigation"]');
    const navigationBackdrop = fixtureElement.querySelector<HTMLButtonElement>('button[aria-label="Close navigation"]');
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
});
