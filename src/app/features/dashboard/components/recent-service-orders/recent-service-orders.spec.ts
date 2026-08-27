import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ServiceOrder, ServiceOrderStatus } from '@core/models/service-order.interface';
import {
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STATUS_ORDER,
  SERVICE_ORDER_STATUS_TONES,
} from '@core/models/service-order-status';
import { vi } from 'vitest';
import { RecentServiceOrdersComponent } from './recent-service-orders';

describe('RecentServiceOrdersComponent', () => {
  let fixture: ComponentFixture<RecentServiceOrdersComponent>;

  const order: ServiceOrder = {
    id: 'order-1',
    code: 'SO-0001',
    workshopId: 'workshop-1',
    customerId: 'customer-1',
    customer: { id: 'customer-1', fullName: 'Ana Pérez' },
    vehicleId: 'vehicle-1',
    vehicle: { id: 'vehicle-1', brand: 'Toyota', model: 'Corolla', plate: '1234-ABC' },
    assignedTechnicianId: 'technician-1',
    assignedTechnician: { userId: 'technician-1', displayName: 'Carlos Ruiz' },
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentServiceOrdersComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(
    orders: readonly ServiceOrder[] = [order],
    loading = false,
    error: string | null = null,
  ): HTMLElement {
    fixture = TestBed.createComponent(RecentServiceOrdersComponent);
    fixture.componentRef.setInput('orders', orders);
    fixture.componentRef.setInput('loading', loading);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders API order data and links its code to the detail', () => {
    const element = render();
    const row = element.querySelector('tbody tr');
    const detailLink = row?.querySelector('a');

    expect(row?.textContent).toContain('SO-0001');
    expect(row?.textContent).toContain('27/08/2026');
    expect(row?.textContent).toContain('Ana Pérez');
    expect(row?.textContent).toContain('Toyota Corolla · 1234-ABC');
    expect(row?.textContent).toContain('Ruido al frenar');
    expect(row?.textContent).toContain('Recibida');
    expect(row?.textContent).toContain('Carlos Ruiz');
    expect(detailLink?.getAttribute('href')).toBe('/service-orders/order-1');
    expect(element.querySelector('a[href="/service-orders"]')?.textContent).toContain('Ver todas');
  });

  it('shows reception and technician fallbacks when the API omits them', () => {
    const element = render([
      {
        ...order,
        reportedIssues: '   ',
        assignedTechnicianId: null,
        assignedTechnician: null,
      },
    ]);

    expect(element.textContent).toContain('Sin detalle de recepción');
    expect(element.textContent).toContain('Sin asignar');
  });

  it('renders translated labels and the expected tone for all nine statuses', () => {
    const orders = SERVICE_ORDER_STATUS_ORDER.map((status, index) => ({
      ...order,
      id: `order-${index}`,
      code: `SO-${index}`,
      status,
    }));
    const element = render(orders);
    const badges = Array.from(element.querySelectorAll<HTMLElement>('[data-status]'));

    expect(badges).toHaveLength(9);
    for (const status of SERVICE_ORDER_STATUS_ORDER) {
      const badge = badges.find((candidate) => candidate.dataset['status'] === status);
      expect(badge?.textContent).toContain(SERVICE_ORDER_STATUS_LABELS[status]);
      expect(badge?.className).toContain(toneClass(status));
    }
  });

  it('renders loading, empty and error states independently', () => {
    let element = render([], true);
    expect(
      element.querySelector('[data-loading="dashboard-recent-service-orders"]'),
    ).not.toBeNull();
    expect(element.textContent).not.toContain('No hay órdenes de servicio registradas.');

    element = render([]);
    expect(element.textContent).toContain('No hay órdenes de servicio registradas.');

    element = render([], false, 'No pudimos cargar las órdenes recientes.');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar las órdenes recientes.',
    );
  });

  it('emits retry from the error action', () => {
    const element = render([], false, 'No pudimos cargar las órdenes recientes.');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    element.querySelector<HTMLButtonElement>('button')?.click();

    expect(retry).toHaveBeenCalledOnce();
  });
});

function toneClass(status: ServiceOrderStatus): string {
  switch (SERVICE_ORDER_STATUS_TONES[status]) {
    case 'info':
      return 'bg-blue-50';
    case 'warning':
      return 'bg-orange-50';
    case 'success':
      return 'bg-emerald-50';
    case 'neutral':
      return 'bg-slate-100';
    case 'danger':
      return 'bg-red-50';
  }
}
