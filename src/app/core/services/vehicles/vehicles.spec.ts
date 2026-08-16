import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { VehiclesService } from './vehicles';

const API = 'https://api.racerlab.test/api';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    service = TestBed.inject(VehiclesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends trimmed search and pagination to the workshop listing', () => {
    service.listForWorkshop({ search: '  ABC  ', page: 2, limit: 50 }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === `${API}/vehicles`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('ABC');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('50');
    request.flush({ items: [], page: 2, limit: 50, total: 0, totalPages: 0 });
  });

  it('keeps the customer-scoped routes for the nested CRUD', () => {
    const base = `${API}/customers/customer-1/vehicles`;

    service.list('customer-1').subscribe();
    http.expectOne((candidate) => candidate.url === base).flush({});

    service.get('customer-1', 'vehicle-1').subscribe();
    http.expectOne(`${base}/vehicle-1`).flush({});

    service.create('customer-1', { plate: 'ABC1234', brand: 'Toyota', model: 'Corolla' }).subscribe();
    const create = http.expectOne(base);
    expect(create.request.method).toBe('POST');
    create.flush({});

    service.update('customer-1', 'vehicle-1', { mileage: 100 }).subscribe();
    const update = http.expectOne(`${base}/vehicle-1`);
    expect(update.request.method).toBe('PATCH');
    update.flush({});

    service.remove('customer-1', 'vehicle-1').subscribe();
    const remove = http.expectOne(`${base}/vehicle-1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
});
