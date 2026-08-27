export type DashboardMetricTone = 'primary' | 'warning' | 'danger';

export type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  detail?: string;
  trend?: string;
  tone: DashboardMetricTone;
  icon: 'orders' | 'vehicle' | 'approval' | 'parts' | 'warning';
};

export type DashboardTechnician = {
  id: string;
  name: string;
  active: number;
  pending: number;
  activePercent: number;
  pendingPercent: number;
  tone: 'primary' | 'warning' | 'success';
};

export type DashboardQuote = {
  id: string;
  customer: string;
  vehicle: string;
  amount: string;
  waitingSince: string;
};

export type DashboardLowStockItem = {
  id: string;
  name: string;
  available: number;
  minimum: number;
  unit: string;
};

export type DashboardSnapshot = {
  metrics: readonly DashboardMetric[];
  technicians: readonly DashboardTechnician[];
  pendingQuotes: readonly DashboardQuote[];
  lowStockItems: readonly DashboardLowStockItem[];
};

export const DASHBOARD_MOCK_DATA: DashboardSnapshot = {
  metrics: [
    {
      id: 'open-orders',
      label: 'Open orders',
      value: 24,
      trend: '4% vs. yesterday',
      tone: 'primary',
      icon: 'orders',
    },
    {
      id: 'vehicles-in-shop',
      label: 'Vehicles in shop',
      value: 18,
      detail: 'Same as yesterday',
      tone: 'primary',
      icon: 'vehicle',
    },
    {
      id: 'waiting-approval',
      label: 'Waiting approval',
      value: 7,
      tone: 'warning',
      icon: 'approval',
    },
    {
      id: 'waiting-parts',
      label: 'Waiting for parts',
      value: 3,
      tone: 'warning',
      icon: 'parts',
    },
    {
      id: 'low-stock',
      label: 'Low stock alerts',
      value: 12,
      detail: 'Action needed',
      tone: 'danger',
      icon: 'warning',
    },
  ],
  technicians: [
    {
      id: 'dave-r',
      name: 'Dave R.',
      active: 3,
      pending: 1,
      activePercent: 60,
      pendingPercent: 20,
      tone: 'primary',
    },
    {
      id: 'mike-l',
      name: 'Mike L.',
      active: 4,
      pending: 0,
      activePercent: 80,
      pendingPercent: 0,
      tone: 'warning',
    },
    {
      id: 'sam-t',
      name: 'Sam T.',
      active: 1,
      pending: 2,
      activePercent: 20,
      pendingPercent: 40,
      tone: 'success',
    },
    {
      id: 'chris-b',
      name: 'Chris B.',
      active: 0,
      pending: 0,
      activePercent: 0,
      pendingPercent: 0,
      tone: 'primary',
    },
  ],
  pendingQuotes: [
    {
      id: 'QUO-2406',
      customer: 'Jordan Blake',
      vehicle: '2020 Mazda CX-5',
      amount: '$684.00',
      waitingSince: 'Waiting 2 hours',
    },
    {
      id: 'QUO-2405',
      customer: 'Priya Shah',
      vehicle: '2017 Audi A4',
      amount: '$1,245.00',
      waitingSince: 'Waiting since yesterday',
    },
    {
      id: 'QUO-2404',
      customer: 'Lucas Martin',
      vehicle: '2016 Subaru Outback',
      amount: '$328.50',
      waitingSince: 'Waiting 1 day',
    },
  ],
  lowStockItems: [
    { id: 'oil-filter-2', name: 'Oil filter 2', available: 2, minimum: 8, unit: 'units' },
    {
      id: 'brake-fluid-dot4',
      name: 'DOT 4 brake fluid',
      available: 3,
      minimum: 12,
      unit: 'bottles',
    },
    { id: 'wiper-blades-24', name: '24 in. wiper blades', available: 1, minimum: 6, unit: 'pairs' },
  ],
};
