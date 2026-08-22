import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Customer,
  CustomerSearch,
  CustomerPage,
  CustomerInput,
} from '@core/models/customer.interface';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(query: CustomerSearch = {}): Observable<CustomerPage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.hasVehicles !== undefined) {
      params = params.set('hasVehicles', String(query.hasVehicles));
    }
    if (query.hasServiceOrders !== undefined) {
      params = params.set('hasServiceOrders', String(query.hasServiceOrders));
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    return this.http.get<CustomerPage>(`${this.apiUrl}/customers`, { params });
  }

  get(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/customers/${id}`);
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers`, input);
  }

  update(id: string, input: Partial<CustomerInput>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/customers/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customers/${id}`);
  }
}
