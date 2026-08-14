import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

export type Vehicle = {
  id: string;
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  vehicleType: string | null;
  notes: string | null;
  serviceOrderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type VehicleInput = {
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string | null;
  vin?: string | null;
  mileage?: number | null;
  vehicleType?: string | null;
  notes?: string | null;
};

export type VehiclePage = {
  items: Vehicle[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type VehicleSearch = {
  search?: string;
  page?: number;
  limit?: number;
};

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(customerId: string, query: VehicleSearch = {}): Observable<VehiclePage> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('limit', query.limit ?? 20);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    return this.http.get<VehiclePage>(`${this.apiUrl}/customers/${customerId}/vehicles`, {
      params,
    });
  }

  get(customerId: string, vehicleId: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(
      `${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`,
    );
  }

  create(customerId: string, input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(
      `${this.apiUrl}/customers/${customerId}/vehicles`,
      input,
    );
  }

  update(
    customerId: string,
    vehicleId: string,
    input: Partial<VehicleInput>,
  ): Observable<Vehicle> {
    return this.http.patch<Vehicle>(
      `${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`,
      input,
    );
  }

  remove(customerId: string, vehicleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/customers/${customerId}/vehicles/${vehicleId}`,
    );
  }
}
