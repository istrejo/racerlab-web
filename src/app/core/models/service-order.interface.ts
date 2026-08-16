export type ServiceOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSIS'
  | 'QUOTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'QUALITY_CONTROL'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type ServiceOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type FuelLevel = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTERS' | 'FULL';

export type CustomerSummary = {
  id: string;
  fullName: string;
};

export type VehicleSummary = {
  id: string;
  plate: string;
  brand: string;
  model: string;
};

export type MemberSummary = {
  userId: string;
  displayName: string;
};

export type StatusHistoryEntry = {
  id: string;
  previousStatus: ServiceOrderStatus | null;
  newStatus: ServiceOrderStatus;
  changedBy: MemberSummary;
  comment: string | null;
  createdAt: string;
};

export type ServiceOrder = {
  id: string;
  code: string;
  workshopId: string;
  customerId: string;
  customer: CustomerSummary;
  vehicleId: string;
  vehicle: VehicleSummary;
  assignedTechnicianId: string | null;
  assignedTechnician: MemberSummary | null;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority | null;
  reportedIssues: string | null;
  receptionNotes: string | null;
  mileageIn: number | null;
  fuelLevel: FuelLevel | null;
  estimatedDeliveryDate: string | null;
  diagnosisCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceOrderDetail = ServiceOrder & {
  createdBy: MemberSummary;
  statusHistory: StatusHistoryEntry[];
};

export type ServiceOrderPage = {
  items: ServiceOrder[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServiceOrderSearch = {
  search?: string;
  status?: ServiceOrderStatus;
  customerId?: string;
  vehicleId?: string;
  page?: number;
  limit?: number;
};

export type ServiceOrderInput = {
  customerId: string;
  vehicleId: string;
  technicianId?: string | null;
  priority?: ServiceOrderPriority | null;
  reportedIssues?: string | null;
  receptionNotes?: string | null;
  mileageIn?: number | null;
  fuelLevel?: FuelLevel | null;
  estimatedDeliveryDate?: string | null;
};

export type ServiceOrderUpdate = Partial<
  Pick<
    ServiceOrderInput,
    | 'priority'
    | 'reportedIssues'
    | 'receptionNotes'
    | 'mileageIn'
    | 'fuelLevel'
    | 'estimatedDeliveryDate'
  >
>;

export type ChangeStatusInput = {
  status: ServiceOrderStatus;
  comment?: string | null;
};

export type AssignTechnicianInput = {
  technicianId: string | null;
};
