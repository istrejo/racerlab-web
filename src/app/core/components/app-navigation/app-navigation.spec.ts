import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { AppNavigationComponent } from './app-navigation';

describe('AppNavigationComponent', () => {
  let fixture: ComponentFixture<AppNavigationComponent>;

  function createWith(overrides: Partial<Record<string, boolean>>) {
    return TestBed.configureTestingModule({
      imports: [AppNavigationComponent],
      providers: [
        provideRouter([]),
        {
          provide: PermissionsService,
          useValue: {
            canWriteOrders: () => overrides['canWriteOrders'] ?? false,
            canReadOrders: () => overrides['canReadOrders'] ?? false,
            canReadCustomers: () => overrides['canReadCustomers'] ?? false,
            canReadVehicles: () => overrides['canReadVehicles'] ?? false,
            canReadQuotes: () => overrides['canReadQuotes'] ?? false,
            canManageUsers: () => overrides['canManageUsers'] ?? false,
          },
        },
      ],
    }).compileComponents();
  }

  it('hides restricted links when the role lacks permission', async () => {
    await createWith({});
    fixture = TestBed.createComponent(AppNavigationComponent);
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    expect(fixtureElement.textContent).not.toContain('Orders');
    expect(fixtureElement.textContent).not.toContain('Customers');
    expect(fixtureElement.textContent).not.toContain('Vehicles');
    expect(fixtureElement.textContent).not.toContain('Quotes');
    expect(fixtureElement.textContent).not.toContain('Settings');
    expect(fixtureElement.querySelector('a[href="/service-orders/new"]')).toBeNull();
  });

  it('shows every link when the role has full permissions', async () => {
    await createWith({
      canWriteOrders: true,
      canReadOrders: true,
      canReadCustomers: true,
      canReadVehicles: true,
      canReadQuotes: true,
      canManageUsers: true,
    });
    fixture = TestBed.createComponent(AppNavigationComponent);
    fixture.detectChanges();

    const fixtureElement: HTMLElement = fixture.nativeElement;
    expect(fixtureElement.textContent).toContain('Orders');
    expect(fixtureElement.textContent).toContain('Customers');
    expect(fixtureElement.textContent).toContain('Vehicles');
    expect(fixtureElement.textContent).toContain('Quotes');
    expect(fixtureElement.textContent).toContain('Settings');
    expect(fixtureElement.querySelector('a[href="/service-orders/new"]')).not.toBeNull();
  });

  it('emits mobileNavigationDismissed when the backdrop is clicked', async () => {
    await createWith({});
    fixture = TestBed.createComponent(AppNavigationComponent);
    fixture.componentRef.setInput('mobileNavigationOpen', true);
    fixture.detectChanges();

    let dismissed = false;
    fixture.componentInstance.mobileNavigationDismissed.subscribe(() => (dismissed = true));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[aria-label="Close navigation"]')
      ?.click();

    expect(dismissed).toBe(true);
  });
});
