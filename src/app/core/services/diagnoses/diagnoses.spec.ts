import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { DiagnosesService, DiagnosisInput } from './diagnoses';

describe('DiagnosesService', () => {
  let service: DiagnosesService;
  let http: HttpTestingController;
  const serviceOrderId = 'order-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
      ],
    });
    service = TestBed.inject(DiagnosesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists diagnoses for a service order', () => {
    service.list(serviceOrderId).subscribe();

    const request = http.expectOne(
      `https://api.racerlab.test/api/service-orders/${serviceOrderId}/diagnoses`,
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('gets a single diagnosis', () => {
    service.get(serviceOrderId, 'diagnosis-1').subscribe();

    const request = http.expectOne(
      `https://api.racerlab.test/api/service-orders/${serviceOrderId}/diagnoses/diagnosis-1`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('creates a diagnosis', () => {
    const input: DiagnosisInput = { description: 'Ruido en frenos' };
    service.create(serviceOrderId, input).subscribe();

    const request = http.expectOne(
      `https://api.racerlab.test/api/service-orders/${serviceOrderId}/diagnoses`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('updates a diagnosis', () => {
    const input: Partial<DiagnosisInput> = { suggestedLabor: 'Cambio de pastillas' };
    service.update(serviceOrderId, 'diagnosis-1', input).subscribe();

    const request = http.expectOne(
      `https://api.racerlab.test/api/service-orders/${serviceOrderId}/diagnoses/diagnosis-1`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('removes a diagnosis', () => {
    service.remove(serviceOrderId, 'diagnosis-1').subscribe();

    const request = http.expectOne(
      `https://api.racerlab.test/api/service-orders/${serviceOrderId}/diagnoses/diagnosis-1`,
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
