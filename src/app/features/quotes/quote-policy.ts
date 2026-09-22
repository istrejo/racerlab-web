import { QuoteApprovalMethod, QuoteItemType, QuoteStatus } from '@core/models/quotes.interface';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  SUPERSEDED: 'Reemplazada',
};

export const QUOTE_STATUS_TONES: Record<QuoteStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SUPERSEDED: 'bg-slate-100 text-slate-700',
};

export const QUOTE_STATUS_FILTERS: readonly QuoteStatus[] = [
  'DRAFT',
  'ACTIVE',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'SUPERSEDED',
];

export const QUOTE_APPROVAL_METHODS: readonly QuoteApprovalMethod[] = [
  'WHATSAPP',
  'PHONE',
  'IN_PERSON',
  'EMAIL',
  'OTHER',
];

export const QUOTE_APPROVAL_METHOD_LABELS: Record<QuoteApprovalMethod, string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'Llamada',
  IN_PERSON: 'En persona',
  EMAIL: 'Correo',
  OTHER: 'Otro',
};

export const QUOTE_ITEM_TYPES: readonly QuoteItemType[] = ['PART', 'LABOR', 'SERVICE', 'OTHER'];

export const QUOTE_ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  PART: 'Repuesto',
  LABOR: 'Mano de obra',
  SERVICE: 'Servicio',
  OTHER: 'Otro',
};

export type QuoteActionKind =
  'edit' | 'activate' | 'approve' | 'reject' | 'expire' | 'cancel' | 'version';

export type QuoteAction = {
  kind: QuoteActionKind;
  label: string;
  modalTitle: string;
  modalDescription: string;
  confirmLabel: string;
  /** Target status for a lifecycle transition; `null` for non-status actions. */
  status: QuoteStatus | null;
  requiresMethod: boolean;
  destructive: boolean;
};

const ACTIONS: Record<QuoteActionKind, QuoteAction> = {
  edit: {
    kind: 'edit',
    label: 'Editar',
    modalTitle: 'Editar cotización',
    modalDescription: '',
    confirmLabel: 'Editar',
    status: null,
    requiresMethod: false,
    destructive: false,
  },
  activate: {
    kind: 'activate',
    label: 'Activar',
    modalTitle: 'Activar cotización',
    modalDescription: 'La cotización pasará a estar activa y dejará de ser editable.',
    confirmLabel: 'Activar',
    status: 'ACTIVE',
    requiresMethod: false,
    destructive: false,
  },
  approve: {
    kind: 'approve',
    label: 'Aprobar',
    modalTitle: 'Aprobar cotización',
    modalDescription: 'Indica cómo aprobó el cliente esta cotización.',
    confirmLabel: 'Aprobar',
    status: 'APPROVED',
    requiresMethod: true,
    destructive: false,
  },
  reject: {
    kind: 'reject',
    label: 'Rechazar',
    modalTitle: 'Rechazar cotización',
    modalDescription: 'Indica cómo rechazó el cliente esta cotización.',
    confirmLabel: 'Rechazar',
    status: 'REJECTED',
    requiresMethod: true,
    destructive: true,
  },
  expire: {
    kind: 'expire',
    label: 'Marcar vencida',
    modalTitle: 'Marcar la cotización como vencida',
    modalDescription: 'La cotización dejará de estar vigente para el cliente.',
    confirmLabel: 'Marcar vencida',
    status: 'EXPIRED',
    requiresMethod: false,
    destructive: true,
  },
  cancel: {
    kind: 'cancel',
    label: 'Cancelar',
    modalTitle: 'Cancelar cotización',
    modalDescription: 'La cotización quedará cancelada y no podrá reactivarse.',
    confirmLabel: 'Cancelar cotización',
    status: 'CANCELLED',
    requiresMethod: false,
    destructive: true,
  },
  version: {
    kind: 'version',
    label: 'Nueva versión',
    modalTitle: 'Crear una nueva versión',
    modalDescription: 'Se creará un borrador con los mismos ítems para que puedas editarlo.',
    confirmLabel: 'Crear versión',
    status: null,
    requiresMethod: false,
    destructive: false,
  },
};

const ACTIONS_BY_STATUS: Record<QuoteStatus, readonly QuoteActionKind[]> = {
  DRAFT: ['edit', 'activate', 'cancel'],
  ACTIVE: ['approve', 'reject', 'expire', 'cancel', 'version'],
  APPROVED: [],
  REJECTED: ['version'],
  EXPIRED: ['version'],
  CANCELLED: ['version'],
  SUPERSEDED: ['version'],
};

export function quoteActionsFor(status: QuoteStatus, canWrite: boolean): QuoteAction[] {
  if (!canWrite) return [];
  return ACTIONS_BY_STATUS[status].map((kind) => ACTIONS[kind]);
}

export function quoteVersionLabel(version: number): string {
  return `Cotización v${version}`;
}

export function sortByVersionDesc<T extends { version: number }>(quotes: readonly T[]): T[] {
  return [...quotes].sort((left, right) => right.version - left.version);
}
