import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { CustomerInput } from '@core/models/customer.interface';
import { CustomersService } from './customers';

describe('CustomersService', () => {
  let service: CustomersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
      ],
    });
    service = TestBed.inject(CustomersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends trimmed search and pagination parameters', () => {
    service.list({ search: '  Ada  ', page: 3, limit: 50 }).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === 'https://api.racerlab.test/api/customers',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Ada');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('50');
    request.flush({ items: [], page: 3, limit: 50, total: 0, totalPages: 0 });
  });

  it('uses the five customer routes with their expected methods', () => {
    const input: CustomerInput = { fullName: 'Ada Lovelace' };

    service.get('customer-1').subscribe();
    http.expectOne('https://api.racerlab.test/api/customers/customer-1').flush({});

    service.create(input).subscribe();
    const create = http.expectOne('https://api.racerlab.test/api/customers');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(input);
    create.flush({});

    service.update('customer-1', input).subscribe();
    const update = http.expectOne('https://api.racerlab.test/api/customers/customer-1');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual(input);
    update.flush({});

    service.remove('customer-1').subscribe();
    const remove = http.expectOne('https://api.racerlab.test/api/customers/customer-1');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
});
