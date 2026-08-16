import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Vehicle,
  VehicleInput,
  VehiclePage,
  VehicleSearch,
  VehicleWithCustomerPage,
} from '@core/models/vehicle.interface';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listForWorkshop(query: VehicleSearch = {}): Observable<VehicleWithCustomerPage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    return this.http.get<VehicleWithCustomerPage>(`${this.apiUrl}/vehicles`, { params });
  }

  list(customerId: string, query: VehicleSearch = {}): Observable<VehiclePage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    return this.http.get<VehiclePage>(`${this.apiUrl}/customers/${customerId}/vehicles`, {
      params,
    });
  }

  get(customerId: string, vehicleId: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`);
  }

  create(customerId: string, input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/customers/${customerId}/vehicles`, input);
  }

  update(customerId: string, vehicleId: string, input: Partial<VehicleInput>): Observable<Vehicle> {
    return this.http.patch<Vehicle>(
      `${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`,
      input,
    );
  }

  remove(customerId: string, vehicleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`);
  }
}
