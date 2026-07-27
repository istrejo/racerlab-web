import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@shared/utils/api-url.token';
import { MembershipsService } from './memberships';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
      ],
    });
    service = TestBed.inject(MembershipsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a user without changing the temporary password payload', () => {
    const payload = {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: null,
      address: null,
      role: 'TECHNICIAN' as const,
      password: 'temporary-secret',
    };

    service.create(payload).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/memberships');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('uses the dedicated endpoint for administrator password reset', () => {
    service.resetPassword('membership-id', 'temporary-secret').subscribe();

    const request = http.expectOne(
      'https://api.racerlab.test/api/memberships/membership-id/reset-password',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ temporaryPassword: 'temporary-secret' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
