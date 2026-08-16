import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CustomerSummary,
  MemberSummary,
  ServiceOrderStatus,
  VehicleSummary,
} from '@core/services/service-orders/service-orders';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

export type QuoteStatus = 'DRAFT' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type QuoteItemType = 'PART' | 'LABOR' | 'SERVICE' | 'OTHER';

export type QuoteItem = {
  id: string;
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice: number | null;
  total: number;
  inventoryProductId: string | null;
  isApproved: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type Quote = {
  id: string;
  serviceOrderId: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number | null;
  tax: number | null;
  total: number;
  approvalMethod: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdBy: MemberSummary;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteServiceOrderSummary = {
  id: string;
  code: string;
  status: ServiceOrderStatus;
};

export type QuoteSummary = {
  id: string;
  status: QuoteStatus;
  total: number;
  itemCount: number;
  serviceOrder: QuoteServiceOrderSummary;
  customer: CustomerSummary;
  vehicle: VehicleSummary;
  createdBy: MemberSummary;
  createdAt: string;
};

export type QuotePage = {
  items: QuoteSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type QuoteSearch = {
  search?: string;
  status?: QuoteStatus;
  serviceOrderId?: string;
  page?: number;
  limit?: number;
};

export type QuoteItemInput = {
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number | null;
};

export type QuoteInput = {
  items: QuoteItemInput[];
  discount?: number | null;
  tax?: number | null;
};

export type QuoteUpdate = Partial<QuoteInput>;

export type ChangeQuoteStatusInput = {
  status: QuoteStatus;
  approvalMethod?: string | null;
};

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listForWorkshop(query: QuoteSearch = {}): Observable<QuotePage> {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.status) params = params.set('status', query.status);
    if (query.serviceOrderId) params = params.set('serviceOrderId', query.serviceOrderId);
    return this.http.get<QuotePage>(`${this.apiUrl}/quotes`, { params });
  }

  list(serviceOrderId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/service-orders/${serviceOrderId}/quotes`);
  }

  get(serviceOrderId: string, quoteId: string): Observable<Quote> {
    return this.http.get<Quote>(
      `${this.apiUrl}/service-orders/${serviceOrderId}/quotes/${quoteId}`,
    );
  }

  create(serviceOrderId: string, input: QuoteInput): Observable<Quote> {
    return this.http.post<Quote>(`${this.apiUrl}/service-orders/${serviceOrderId}/quotes`, input);
  }

  update(serviceOrderId: string, quoteId: string, input: QuoteUpdate): Observable<Quote> {
    return this.http.patch<Quote>(
      `${this.apiUrl}/service-orders/${serviceOrderId}/quotes/${quoteId}`,
      input,
    );
  }

  changeStatus(
    serviceOrderId: string,
    quoteId: string,
    input: ChangeQuoteStatusInput,
  ): Observable<Quote> {
    return this.http.patch<Quote>(
      `${this.apiUrl}/service-orders/${serviceOrderId}/quotes/${quoteId}/status`,
      input,
    );
  }
}
