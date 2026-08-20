import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import {
  AssignTechnicianInput,
  ChangeStatusInput,
  ServiceOrderInput,
  ServiceOrderUpdate,
} from '@core/models/service-order.interface';
import { ServiceOrdersService } from './service-orders';

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
      ],
    });
    service = TestBed.inject(ServiceOrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends trimmed search, pagination and filters', () => {
    service
      .list({ search: '  ABC1234  ', page: 2, status: 'DIAGNOSIS', customerId: 'cust-1', vehicleId: 'veh-1' })
      .subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === 'https://api.racerlab.test/api/service-orders',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('ABC1234');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('status')).toBe('DIAGNOSIS');
    expect(request.request.params.get('customerId')).toBe('cust-1');
    expect(request.request.params.get('vehicleId')).toBe('veh-1');
    request.flush({ items: [], page: 2, limit: 20, total: 0, totalPages: 0 });
  });

  it('omits optional filters and defaults pagination when not provided', () => {
    service.list().subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === 'https://api.racerlab.test/api/service-orders',
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('status')).toBe(false);
    request.flush({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('gets a service order by id', () => {
    service.get('order-1').subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/service-orders/order-1');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('creates a service order', () => {
    const input: ServiceOrderInput = { customerId: 'cust-1', vehicleId: 'veh-1' };
    service.create(input).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/service-orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('updates a service order', () => {
    const input: ServiceOrderUpdate = { priority: 'HIGH' };
    service.update('order-1', input).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/service-orders/order-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('changes the status of a service order', () => {
    const input: ChangeStatusInput = { status: 'DIAGNOSIS' };
    service.changeStatus('order-1', input).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/service-orders/order-1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('assigns a technician to a service order', () => {
    const input: AssignTechnicianInput = { technicianId: 'tech-1' };
    service.assignTechnician('order-1', input).subscribe();

    const request = http.expectOne(
      'https://api.racerlab.test/api/service-orders/order-1/technician',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });
});
