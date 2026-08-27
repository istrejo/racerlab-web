import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ServiceOrder, ServiceOrderPage } from '@core/models/service-order.interface';
import { PermissionsService } from '@core/services/permissions/permissions';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DASHBOARD_MOCK_DATA } from './dashboard.mock-data';
import DashboardComponent from './dashboard';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let list: ReturnType<typeof vi.fn>;
  const canReadOrders = signal(true);
  const canWriteOrders = signal(false);

  const order: ServiceOrder = {
    id: 'order-1',
    code: 'SO-0001',
    workshopId: 'workshop-1',
    customerId: 'customer-1',
    customer: { id: 'customer-1', fullName: 'Ana Pérez' },
    vehicleId: 'vehicle-1',
    vehicle: { id: 'vehicle-1', brand: 'Toyota', model: 'Corolla', plate: '1234-ABC' },
    assignedTechnicianId: null,
    assignedTechnician: null,
    status: 'RECEIVED',
    priority: 'NORMAL',
    reportedIssues: 'Ruido al frenar',
    receptionNotes: null,
    mileageIn: 42_000,
    fuelLevel: 'HALF',
    estimatedDeliveryDate: null,
    diagnosisCount: 0,
    createdAt: '2026-08-27T10:15:00.000Z',
    updatedAt: '2026-08-27T10:15:00.000Z',
  };

  const page: ServiceOrderPage = {
    items: [order],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    canReadOrders.set(true);
    canWriteOrders.set(false);
    list = vi.fn(() => of(page));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: PermissionsService,
          useValue: { canReadOrders, canWriteOrders },
        },
        { provide: ServiceOrdersService, useValue: { list } },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  }

  it('loads exactly the ten most recent orders from the first page', () => {
    createComponent();

    expect(list).toHaveBeenCalledOnce();
    expect(list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(component.recentOrders()).toEqual([order]);
    expect(component.recentOrdersLoading()).toBe(false);
    expect(component.recentOrdersError()).toBeNull();
  });

  it('does not request or display orders without read permission', () => {
    canReadOrders.set(false);
    createComponent();
    fixture.detectChanges();

    expect(list).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-dashboard-recent-service-orders')).toBeNull();
  });

  it('keeps the dashboard available after an error and retries the request', () => {
    list
      .mockImplementationOnce(() => throwError(() => new Error('Network error')))
      .mockImplementationOnce(() => of(page));
    createComponent();

    expect(component.recentOrders()).toEqual([]);
    expect(component.recentOrdersError()).toBe('No pudimos cargar las órdenes recientes.');
    expect(component.recentOrdersLoading()).toBe(false);

    component.retryRecentOrders();

    expect(list).toHaveBeenCalledTimes(2);
    expect(component.recentOrders()).toEqual([order]);
    expect(component.recentOrdersError()).toBeNull();
    expect(component.recentOrdersLoading()).toBe(false);
  });

  it('renders the empty state when the workshop has no orders', () => {
    list.mockReturnValue(of({ ...page, items: [], total: 0, totalPages: 0 }));
    createComponent();
    fixture.detectChanges();

    expect(component.recentOrders()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay órdenes de servicio registradas.');
  });

  it('exposes pending quotes mapped into attention list items', () => {
    createComponent();
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
    createComponent();
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
    createComponent();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/service-orders/new"]')).toBeNull();

    canWriteOrders.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/service-orders/new"]')).not.toBeNull();
  });
});
