import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { map, Observable, tap } from 'rxjs';
import { AuthSessionService } from '../session/session';
import type {
  AuthTokenResponse,
  LoginRequest,
  RefreshFailureKind,
  SessionRestoreResult,
  SignupRequest,
} from '../../model/auth.interface';

export { AuthRefreshError, AuthRefreshSupersededError } from '../../model/auth.interface';
export type {
  ActiveWorkshop,
  AuthSessionBootstrap,
  AuthTokenResponse,
  AuthUser,
  LoginRequest,
  ProfileState,
  RefreshFailureKind,
  SessionRestoreResult,
  SessionState,
  SignupRequest,
  UserRole,
  WorkshopProfile,
} from '../../model/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly session = inject(AuthSessionService);

  readonly isAuthenticated = this.session.isAuthenticated;
  readonly user = this.session.user;
  readonly activeWorkshop = this.session.activeWorkshop;
  readonly profile = this.session.profile;
  readonly hasActiveWorkshop = this.session.hasActiveWorkshop;
  readonly role = this.session.role;
  readonly requiresPasswordChange = this.session.requiresPasswordChange;
  readonly sessionState = this.session.sessionState;
  readonly profileState = this.session.profileState;
  readonly sessionExpired = this.session.sessionExpired;
  readonly sessionClosed = this.session.sessionClosed;
  readonly canManageUsers = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'OWNER';
  });
  readonly canReadCustomers = computed(() => {
    const role = this.role();
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'ADVISOR' ||
      role === 'TECHNICIAN'
    );
  });
  readonly canWriteCustomers = computed(() => {
    const role = this.role();
    return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' || role === 'ADVISOR';
  });
  readonly canDeleteCustomers = computed(() => {
    const role = this.role();
    return role === 'OWNER' || role === 'ADMIN';
  });

  login(credentials: LoginRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.session.startSession(response)),
        map(() => undefined),
      );
  }

  signup(identity: SignupRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/signup`, identity, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.session.startSession(response)),
        map(() => undefined),
      );
  }

  ensureSession(forceRefresh = false): Observable<SessionRestoreResult> {
    return this.session.ensureSession(forceRefresh);
  }

  probeSession(): Observable<SessionRestoreResult> {
    return this.session.probeSession();
  }

  refreshAccessToken(staleAccessToken?: string): Observable<string> {
    return this.session.refreshAccessToken(staleAccessToken);
  }

  loadCurrentUser(): Observable<void> {
    return this.session.loadCurrentUser();
  }

  logout(): Observable<void> {
    return this.session.logout();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(() => this.session.markPasswordChanged()));
  }

  applyTokenResponse(response: AuthTokenResponse): Observable<void> {
    return this.session.applyTokenResponse(response);
  }

  defaultAuthenticatedRoute(): string {
    if (this.requiresPasswordChange()) {
      return '/change-password';
    }

    return this.hasActiveWorkshop() ? '/dashboard' : '/workshops/select';
  }

  getAccessToken(): string | null {
    return this.session.getAccessToken();
  }

  hasValidAccessToken(): boolean {
    return this.session.hasValidAccessToken();
  }

  needsRefresh(windowMs?: number): boolean {
    return this.session.needsRefresh(windowMs);
  }

  handleRefreshFailure(error: unknown): RefreshFailureKind {
    return this.session.handleRefreshFailure(error);
  }

  dismissSessionExpired(): void {
    this.session.dismissSessionExpired();
  }
}
