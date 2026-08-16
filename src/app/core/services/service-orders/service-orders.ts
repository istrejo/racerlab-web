import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssignTechnicianInput,
  ChangeStatusInput,
  ServiceOrderDetail,
  ServiceOrderInput,
  ServiceOrderPage,
  ServiceOrderSearch,
  ServiceOrderUpdate,
} from '@core/models/service-order.interface';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(query: ServiceOrderSearch = {}): Observable<ServiceOrderPage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
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

  changeStatus(serviceOrderId: string, input: ChangeStatusInput): Observable<ServiceOrderDetail> {
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
