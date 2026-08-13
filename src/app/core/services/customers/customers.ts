import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

export type Customer = {
  id: string;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  vehicleCount: number;
  serviceOrderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type CustomerPage = {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerSearch = {
  search?: string;
  page?: number;
  limit?: number;
};

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(query: CustomerSearch = {}): Observable<CustomerPage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
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
