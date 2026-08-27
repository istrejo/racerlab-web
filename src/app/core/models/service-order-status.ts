import type { ServiceOrderStatus } from './service-order.interface';

export type ServiceOrderStatusTone = 'info' | 'warning' | 'success' | 'neutral' | 'danger';

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECEIVED: 'Recibida',
  DIAGNOSIS: 'Diagnóstico',
  QUOTED: 'Cotizada',
  APPROVED: 'Aprobada',
  IN_PROGRESS: 'En progreso',
  QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Lista para entrega',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

export const SERVICE_ORDER_STATUS_ORDER: readonly ServiceOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'QUOTED',
  'APPROVED',
  'IN_PROGRESS',
  'QUALITY_CONTROL',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const SERVICE_ORDER_STATUS_TONES: Record<ServiceOrderStatus, ServiceOrderStatusTone> = {
  RECEIVED: 'info',
  DIAGNOSIS: 'info',
  QUOTED: 'info',
  APPROVED: 'warning',
  IN_PROGRESS: 'warning',
  QUALITY_CONTROL: 'warning',
  READY_FOR_DELIVERY: 'success',
  DELIVERED: 'neutral',
  CANCELLED: 'danger',
};
