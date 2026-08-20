import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardServiceOrder } from '../../dashboard/dashboard.mock-data';
import { RecentServiceOrdersComponent } from './recent-service-orders';

describe('RecentServiceOrdersComponent', () => {
  let fixture: ComponentFixture<RecentServiceOrdersComponent>;

  const orders: DashboardServiceOrder[] = [
    {
      id: 'ORD-8901',
      customer: 'Sarah Jenkins',
      vehicle: '2019 Toyota Camry',
      service: 'Full synthetic oil change',
      status: 'Reception',
      technician: 'Unassigned',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentServiceOrdersComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentServiceOrdersComponent);
    fixture.componentRef.setInput('orders', orders);
    fixture.detectChanges();
  });

  it('renders one table row per order with its details', () => {
    const fixtureElement: HTMLElement = fixture.nativeElement;
    const rows = fixtureElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('ORD-8901');
    expect(rows[0].textContent).toContain('Sarah Jenkins');
    expect(rows[0].textContent).toContain('2019 Toyota Camry');
    expect(rows[0].textContent).toContain('Reception');
  });

  it('links to the service orders list', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/service-orders');
  });
});
