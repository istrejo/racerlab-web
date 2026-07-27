import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { API_URL } from '@shared/utils/api-url.token';
import { AuthService, AuthTokenResponse } from '../auth/auth';
import { WorkshopsService } from './workshops';

describe('WorkshopsService', () => {
  const applyTokenResponse = vi.fn();
  let service: WorkshopsService;
  let http: HttpTestingController;

  beforeEach(() => {
    applyTokenResponse.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
        { provide: AuthService, useValue: { applyTokenResponse } },
      ],
    });
    service = TestBed.inject(WorkshopsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a workshop and installs the returned active context', () => {
    const response: AuthTokenResponse = {
      accessToken: 'workshop-token',
      tokenType: 'Bearer',
      activeWorkshop: {
        workshopId: 'workshop-id',
        membershipId: 'membership-id',
        name: 'Racer Lab Norte',
        role: 'OWNER',
      },
      requiresWorkshopSelection: false,
      requiresPasswordChange: false,
    };

    service.create({ name: 'Racer Lab Norte' }).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/workshops');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Racer Lab Norte' });
    request.flush(response);

    expect(applyTokenResponse).toHaveBeenCalledWith(response);
  });
});
