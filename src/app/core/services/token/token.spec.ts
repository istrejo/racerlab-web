import { TestBed } from '@angular/core/testing';
import { AuthTokenService } from './token';

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTokenService);
  });

  function token(
    expiresInSeconds = 300,
    claims: { sub?: string; wid?: string; mid?: string } = {},
  ): string {
    const payload = btoa(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        ...claims,
      }),
    );
    return `header.${payload}.signature`;
  }

  it('parses and stores access-token metadata', () => {
    const accessToken = token(300, {
      sub: 'user-id',
      wid: 'workshop-id',
      mid: 'membership-id',
    });
    const metadata = service.readAccessTokenMetadata(accessToken);

    expect(metadata).toMatchObject({
      subject: 'user-id',
      workshopId: 'workshop-id',
      membershipId: 'membership-id',
    });
    service.setAccessToken(accessToken, metadata!);
    expect(service.getAccessToken()).toBe(accessToken);
    expect(service.getSubject()).toBe('user-id');
    expect(service.hasValidAccessToken()).toBe(true);
  });

  it('rejects malformed and expired access tokens', () => {
    expect(service.readAccessTokenMetadata('not-a-jwt')).toBeNull();

    const expiredToken = token(-10, { sub: 'user-id' });
    const metadata = service.readAccessTokenMetadata(expiredToken)!;
    service.setAccessToken(expiredToken, metadata);

    expect(service.hasValidAccessToken()).toBe(false);
    expect(service.needsRefresh()).toBe(true);
  });

  it('compares identity and workshop context independently from token expiry', () => {
    const original = token(30, {
      sub: 'user-id',
      wid: 'workshop-id',
      mid: 'membership-id',
    });
    const replacement = token(600, {
      sub: 'user-id',
      wid: 'workshop-id',
      mid: 'membership-id',
    });
    const otherWorkshop = token(600, {
      sub: 'user-id',
      wid: 'other-workshop',
      mid: 'other-membership',
    });

    expect(service.hasSameAccessContext(original, replacement)).toBe(true);
    expect(service.hasSameAccessContext(original, otherWorkshop)).toBe(false);
  });

  it('clears both the token and its derived metadata', () => {
    const accessToken = token(300, { sub: 'user-id' });
    service.setAccessToken(accessToken, service.readAccessTokenMetadata(accessToken)!);

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getSubject()).toBeNull();
  });
});
