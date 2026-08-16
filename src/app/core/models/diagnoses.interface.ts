import { MemberSummary } from './service-order.interface';

export type Diagnosis = {
  id: string;
  serviceOrderId: string;
  technician: MemberSummary;
  description: string;
  requiredPartsNotes: string | null;
  suggestedLabor: string | null;
  createdAt: string;
  updatedAt: string;
};
