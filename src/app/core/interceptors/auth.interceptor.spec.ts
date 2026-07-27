import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../shared/utils/api-url.token';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '@core/services/auth/auth';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let accessToken: string | null;

  beforeEach(() => {
    accessToken = 'access-token';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.racerlab.test/api' },
        { provide: AuthService, useValue: { getAccessToken: () => accessToken } },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds a bearer token to protected API requests', () => {
    TestBed.inject(HttpClient).get('https://api.racerlab.test/api/customers').subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/customers');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush([]);
  });

  it('does not attach a bearer token to auth endpoints', () => {
    TestBed.inject(HttpClient).post('https://api.racerlab.test/api/auth/refresh', {}).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/refresh');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: 'refreshed-token', tokenType: 'Bearer' });
  });

  it('does not attach a bearer token to public signup', () => {
    TestBed.inject(HttpClient).post('https://api.racerlab.test/api/auth/signup', {}).subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/signup');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: 'signup-token', tokenType: 'Bearer' });
  });

  it('attaches a bearer token to the protected password-change endpoint', () => {
    TestBed.inject(HttpClient)
      .post('https://api.racerlab.test/api/auth/change-password', {})
      .subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/auth/change-password');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush(null);
  });

  it('does not attach a bearer token when the session token is blank', () => {
    accessToken = ' ';
    TestBed.inject(HttpClient).get('https://api.racerlab.test/api/customers').subscribe();

    const request = http.expectOne('https://api.racerlab.test/api/customers');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });
});
