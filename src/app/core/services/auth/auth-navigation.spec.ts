import { authenticatedDestination, sanitizeReturnUrl } from './auth-navigation';

describe('auth navigation helpers', () => {
  it.each([
    ['//malicious.example/path'],
    ['https://malicious.example/path'],
    ['/login'],
    ['/signup?returnUrl=/dashboard'],
    ['/session-unavailable'],
    ['/change-password'],
    ['/workshops/select'],
    ['/workshops/new'],
  ])('rejects unsafe or public return URL %s', (value) => {
    expect(sanitizeReturnUrl(value)).toBeNull();
  });

  it('preserves an internal route with query and fragment', () => {
    expect(sanitizeReturnUrl('/customers/42?tab=vehicles#history')).toBe(
      '/customers/42?tab=vehicles#history',
    );
  });

  it('prioritizes mandatory auth routes over the requested destination', () => {
    expect(
      authenticatedDestination(
        { defaultAuthenticatedRoute: () => '/change-password' },
        '/customers',
      ),
    ).toBe('/change-password?returnUrl=%2Fcustomers');
  });
});
