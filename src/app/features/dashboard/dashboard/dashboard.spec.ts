import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { DASHBOARD_MOCK_DATA } from './dashboard.mock-data';
import DashboardComponent from './dashboard';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  const canWriteOrders = signal(false);

  beforeEach(async () => {
    canWriteOrders.set(false);
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), { provide: PermissionsService, useValue: { canWriteOrders } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('exposes pending quotes mapped into attention list items', () => {
    const expected = DASHBOARD_MOCK_DATA.pendingQuotes[0];
    const items = component.pendingQuoteItems();

    expect(items).toHaveLength(DASHBOARD_MOCK_DATA.pendingQuotes.length);
    expect(items[0]).toEqual({
      id: expected.id,
      primary: expected.customer,
      secondary: `${expected.id} - ${expected.vehicle}`,
      value: expected.amount,
      detail: expected.waitingSince,
    });
  });

  it('exposes low stock items mapped into attention list items', () => {
    const expected = DASHBOARD_MOCK_DATA.lowStockItems[0];
    const items = component.lowStockItems();

    expect(items).toHaveLength(DASHBOARD_MOCK_DATA.lowStockItems.length);
    expect(items[0]).toEqual({
      id: expected.id,
      primary: expected.name,
      secondary: `Minimum: ${expected.minimum} ${expected.unit}`,
      value: `${expected.available} ${expected.unit}`,
      detail: 'available',
    });
  });

  it('shows the new order action only when the user can write orders', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/service-orders/new"]')).toBeNull();

    canWriteOrders.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/service-orders/new"]')).not.toBeNull();
  });
});
