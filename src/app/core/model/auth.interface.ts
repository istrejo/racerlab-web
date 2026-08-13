export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export type UserRole =
  'OWNER' | 'ADMIN' | 'MANAGER' | 'ADVISOR' | 'TECHNICIAN' | 'INVENTORY_MANAGER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface WorkshopProfile {
  displayName: string;
  phone: string | null;
  address: string | null;
}

export interface ActiveWorkshop {
  workshopId: string;
  membershipId: string;
  name: string;
  role: UserRole;
  profile?: WorkshopProfile;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
  activeWorkshop: ActiveWorkshop | null;
  requiresWorkshopSelection: boolean;
  requiresPasswordChange: boolean;
}

export interface AuthSessionBootstrap {
  user: AuthUser;
  activeWorkshop: ActiveWorkshop | null;
  requiresPasswordChange: boolean;
}

export type SessionState = 'idle' | 'restoring' | 'authenticated' | 'anonymous';
export type ProfileState = 'idle' | 'loading' | 'ready' | 'error';
export type SessionRestoreResult = 'authenticated' | 'anonymous' | 'unavailable';
export type RefreshFailureKind = 'invalid' | 'unavailable';
export class AuthRefreshError extends Error {
  constructor(
    readonly kind: RefreshFailureKind,
    options?: ErrorOptions,
  ) {
    super(
      kind === 'invalid'
        ? 'The refresh session is invalid.'
        : 'The session service is unavailable.',
      options,
    );
    this.name = 'AuthRefreshError';
  }
}
