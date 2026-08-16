import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { QuotesService } from './quotes';

const API = 'https://api.racerlab.test/api';

describe('QuotesService', () => {
  let service: QuotesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    service = TestBed.inject(QuotesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends trimmed search, status, and pagination to the workshop listing', () => {
    service
      .listForWorkshop({ search: '  SO-1  ', status: 'ACTIVE', page: 2, limit: 50 })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === `${API}/quotes`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('SO-1');
    expect(request.request.params.get('status')).toBe('ACTIVE');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('50');
    request.flush({ items: [], page: 2, limit: 50, total: 0, totalPages: 0 });
  });

  it('omits optional filters when they are not provided', () => {
    service.listForWorkshop().subscribe();

    const request = http.expectOne((candidate) => candidate.url === `${API}/quotes`);
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('status')).toBe(false);
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('uses the nested service order routes for read and write operations', () => {
    const base = `${API}/service-orders/order-1/quotes`;

    service.list('order-1').subscribe();
    http.expectOne(base).flush([]);

    service.get('order-1', 'quote-1').subscribe();
    http.expectOne(`${base}/quote-1`).flush({});

    service.create('order-1', { items: [] }).subscribe();
    const create = http.expectOne(base);
    expect(create.request.method).toBe('POST');
    create.flush({});

    service.update('order-1', 'quote-1', { discount: 5 }).subscribe();
    const update = http.expectOne(`${base}/quote-1`);
    expect(update.request.method).toBe('PATCH');
    update.flush({});

    service.changeStatus('order-1', 'quote-1', { status: 'ACTIVE' }).subscribe();
    const status = http.expectOne(`${base}/quote-1/status`);
    expect(status.request.method).toBe('PATCH');
    expect(status.request.body).toEqual({ status: 'ACTIVE' });
    status.flush({});
  });
});
