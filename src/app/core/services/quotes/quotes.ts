import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ChangeQuoteStatusInput,
  Quote,
  QuoteInput,
  QuotePage,
  QuoteSearch,
  QuoteUpdate,
} from '@core/models/quotes.interface';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';

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
