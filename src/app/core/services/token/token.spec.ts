import { TestBed } from '@angular/core/testing';
import { AuthTokenService } from './token';

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTokenService);
  });

  it('keeps the access token only in memory', () => {
    service.setAccessToken('access-token');

    expect(service.getAccessToken()).toBe('access-token');
    expect(service.hasAccessToken()).toBe(true);
  });

  it('clears the access token', () => {
    service.setAccessToken('access-token');
    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.hasAccessToken()).toBe(false);
  });
});
