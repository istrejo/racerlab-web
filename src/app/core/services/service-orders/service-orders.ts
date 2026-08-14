import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

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
    'priority' | 'reportedIssues' | 'receptionNotes' | 'mileageIn' | 'fuelLevel' | 'estimatedDeliveryDate'
  >
>;

export type ChangeStatusInput = {
  status: ServiceOrderStatus;
  comment?: string | null;
};

export type AssignTechnicianInput = {
  technicianId: string | null;
};

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(query: ServiceOrderSearch = {}): Observable<ServiceOrderPage> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('limit', query.limit ?? 20);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.status) params = params.set('status', query.status);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.vehicleId) params = params.set('vehicleId', query.vehicleId);
    return this.http.get<ServiceOrderPage>(`${this.apiUrl}/service-orders`, { params });
  }

  get(serviceOrderId: string): Observable<ServiceOrderDetail> {
    return this.http.get<ServiceOrderDetail>(`${this.apiUrl}/service-orders/${serviceOrderId}`);
  }

  create(input: ServiceOrderInput): Observable<ServiceOrderDetail> {
    return this.http.post<ServiceOrderDetail>(`${this.apiUrl}/service-orders`, input);
  }

  update(serviceOrderId: string, input: ServiceOrderUpdate): Observable<ServiceOrderDetail> {
    return this.http.patch<ServiceOrderDetail>(
      `${this.apiUrl}/service-orders/${serviceOrderId}`,
      input,
    );
  }

  changeStatus(
    serviceOrderId: string,
    input: ChangeStatusInput,
  ): Observable<ServiceOrderDetail> {
    return this.http.patch<ServiceOrderDetail>(
      `${this.apiUrl}/service-orders/${serviceOrderId}/status`,
      input,
    );
  }

  assignTechnician(
    serviceOrderId: string,
    input: AssignTechnicianInput,
  ): Observable<ServiceOrderDetail> {
    return this.http.patch<ServiceOrderDetail>(
      `${this.apiUrl}/service-orders/${serviceOrderId}/technician`,
      input,
    );
  }
}
