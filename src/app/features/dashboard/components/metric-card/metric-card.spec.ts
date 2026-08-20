import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardMetric } from '../../dashboard/dashboard.mock-data';
import { MetricCardComponent } from './metric-card';

describe('MetricCardComponent', () => {
  let fixture: ComponentFixture<MetricCardComponent>;

  const metric: DashboardMetric = {
    id: 'open-orders',
    label: 'Open orders',
    value: 24,
    trend: '4% vs. yesterday',
    tone: 'primary',
    icon: 'orders',
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('metric', metric);
    fixture.detectChanges();
  });

  it('renders the label, value and trend', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Open orders');
    expect(text).toContain('24');
    expect(text).toContain('4% vs. yesterday');
  });

  it('shows the detail text only when present', () => {
    fixture.componentRef.setInput('metric', { ...metric, trend: undefined, detail: 'Action needed' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Action needed');
  });
});
