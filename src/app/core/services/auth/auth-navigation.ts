import { AuthService } from './auth';

const NON_RETURNABLE_PATHS = new Set([
  '/login',
  '/signup',
  '/session-unavailable',
  '/change-password',
  '/workshops/select',
  '/workshops/new',
]);

export function sanitizeReturnUrl(value: string | null | undefined): string | null {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  try {
    const base = new URL('https://racerlab.local');
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin || NON_RETURNABLE_PATHS.has(parsed.pathname)) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function authenticatedDestination(
  auth: Pick<AuthService, 'defaultAuthenticatedRoute'>,
  returnUrl?: string | null,
): string {
  const requiredRoute = auth.defaultAuthenticatedRoute();
  if (requiredRoute !== '/dashboard') {
    const safeReturnUrl = sanitizeReturnUrl(returnUrl);
    return safeReturnUrl
      ? `${requiredRoute}?returnUrl=${encodeURIComponent(safeReturnUrl)}`
      : requiredRoute;
  }

  return sanitizeReturnUrl(returnUrl) ?? requiredRoute;
}
