import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { AuthTokenService } from '../token/token';
import {
  AuthRefreshError,
  AuthSessionBootstrap,
  AuthTokenResponse,
  AuthUser,
  ActiveWorkshop,
  LoginRequest,
  ProfileState,
  RefreshFailureKind,
  SessionRestoreResult,
  SessionState,
  SignupRequest,
} from '../../models/auth.interface';

const AUTH_REQUEST_TIMEOUT_MS = 5_000;

export { AuthRefreshError } from '../../models/auth.interface';
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
} from '../../models/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly tokenService = inject(AuthTokenService);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly activeWorkshopState = signal<ActiveWorkshop | null>(null);
  private readonly requiresPasswordChangeState = signal(false);
  private readonly sessionStateValue = signal<SessionState>('idle');
  private readonly profileStateValue = signal<ProfileState>('idle');
  private readonly sessionExpiredState = signal(false);
  private readonly sessionClosedState = signal(false);
  private refreshInFlight$: Observable<string> | null = null;
  private restoreInFlight$: Observable<SessionRestoreResult> | null = null;

  readonly isAuthenticated = computed(() => this.tokenService.hasAccessToken());
  readonly user = this.userState.asReadonly();
  readonly activeWorkshop = this.activeWorkshopState.asReadonly();
  readonly profile = computed(() => this.activeWorkshopState()?.profile ?? null);
  readonly hasActiveWorkshop = computed(() => this.activeWorkshopState() !== null);
  readonly role = computed(() => this.activeWorkshopState()?.role ?? null);
  readonly requiresPasswordChange = this.requiresPasswordChangeState.asReadonly();
  readonly sessionState = this.sessionStateValue.asReadonly();
  readonly profileState = this.profileStateValue.asReadonly();
  readonly sessionExpired = this.sessionExpiredState.asReadonly();
  readonly sessionClosed = this.sessionClosedState.asReadonly();
  login(credentials: LoginRequest): Observable<void> {
    return this.requestSession('/auth/login', credentials);
  }

  signup(identity: SignupRequest): Observable<void> {
    return this.requestSession('/auth/signup', identity);
  }

  ensureSession(forceRefresh = false): Observable<SessionRestoreResult> {
    if (!forceRefresh && this.hasValidAccessToken()) {
      this.sessionStateValue.set('authenticated');
      return of('authenticated');
    }

    return this.restoreSession();
  }

  probeSession(): Observable<SessionRestoreResult> {
    if (this.hasValidAccessToken()) {
      return of('authenticated');
    }

    return this.restoreSession();
  }

  refreshAccessToken(staleAccessToken?: string): Observable<string> {
    const currentToken = this.getAccessToken();
    if (staleAccessToken && currentToken && currentToken !== staleAccessToken) {
      return of(currentToken);
    }

    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refresh$ = this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        timeout(AUTH_REQUEST_TIMEOUT_MS),
        tap((response) => this.acceptTokenResponse(response)),
        map((response) => response.accessToken),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof AuthRefreshError
              ? error
              : new AuthRefreshError(this.classifyRefreshFailure(error), { cause: error }),
          ),
        ),
        finalize(() => {
          if (this.refreshInFlight$ === refresh$) {
            this.refreshInFlight$ = null;
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.refreshInFlight$ = refresh$;
    return refresh$;
  }

  loadCurrentUser(): Observable<void> {
    this.profileStateValue.set('loading');
    return this.http.get<AuthSessionBootstrap>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        this.userState.set(response.user);
        this.activeWorkshopState.set(response.activeWorkshop);
        this.requiresPasswordChangeState.set(response.requiresPasswordChange);
        this.profileStateValue.set('ready');
      }),
      map(() => undefined),
      catchError((error: unknown) => {
        this.profileStateValue.set('error');
        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<void> {
    // Clear local state eagerly so the UI reflects the logged-out condition
    // immediately, before the server round-trip completes.
    // TODO: set sessionClosedState.set(true) here once cross-tab logout
    // detection is added (e.g. via a backend-controlled mechanism). Using
    // BroadcastChannel or localStorage events is explicitly forbidden by
    // AGENTS.md. Until then, sessionClosed is intentionally always false.
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
    this.clearSession();
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(() => this.requiresPasswordChangeState.set(false)));
  }

  applyTokenResponse(response: AuthTokenResponse): Observable<void> {
    this.acceptTokenResponse(response);
    return of(undefined);
  }

  defaultAuthenticatedRoute(): string {
    if (this.requiresPasswordChange()) {
      return '/change-password';
    }

    return this.hasActiveWorkshop() ? '/dashboard' : '/workshops/select';
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  hasValidAccessToken(): boolean {
    return this.tokenService.hasAccessToken();
  }

  handleRefreshFailure(error: unknown): RefreshFailureKind {
    const kind =
      error instanceof AuthRefreshError ? error.kind : this.classifyRefreshFailure(error);
    this.clearSession();
    this.sessionExpiredState.set(true);
    return kind;
  }

  dismissSessionExpired(): void {
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
  }

  private requestSession(path: string, body: unknown): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}${path}`, body, { withCredentials: true })
      .pipe(
        tap((response) => this.acceptTokenResponse(response)),
        map(() => undefined),
      );
  }

  private restoreSession(): Observable<SessionRestoreResult> {
    if (this.restoreInFlight$) {
      return this.restoreInFlight$;
    }

    this.sessionStateValue.set('restoring');
    const restore$ = this.refreshAccessToken().pipe(
      map(() => 'authenticated' as const),
      catchError((error: unknown) => {
        const kind =
          error instanceof AuthRefreshError ? error.kind : this.classifyRefreshFailure(error);
        this.clearSession();
        this.sessionExpiredState.set(false);
        return of(kind === 'invalid' ? ('anonymous' as const) : ('unavailable' as const));
      }),
      finalize(() => {
        if (this.restoreInFlight$ === restore$) {
          this.restoreInFlight$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.restoreInFlight$ = restore$;
    return restore$;
  }

  private acceptTokenResponse(response: AuthTokenResponse): void {
    if (!response?.accessToken?.trim() || !response.user?.id) {
      this.clearSession();
      throw new AuthRefreshError('invalid');
    }

    this.tokenService.setAccessToken(response.accessToken);
    this.userState.set(response.user);
    this.activeWorkshopState.set(response.activeWorkshop);
    this.requiresPasswordChangeState.set(response.requiresPasswordChange);
    this.sessionStateValue.set('authenticated');
    this.profileStateValue.set('ready');
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
  }

  private classifyRefreshFailure(error: unknown): RefreshFailureKind {
    if (error instanceof TimeoutError) {
      return 'unavailable';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return 'unavailable';
    }

    return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500
      ? 'unavailable'
      : 'invalid';
  }

  private clearSession(): void {
    this.tokenService.clear();
    this.userState.set(null);
    this.activeWorkshopState.set(null);
    this.requiresPasswordChangeState.set(false);
    this.sessionStateValue.set('anonymous');
    this.profileStateValue.set('idle');
  }
}
