import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import {
  catchError,
  defer,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export type UserRole =
  'OWNER' | 'ADMIN' | 'MANAGER' | 'ADVISOR' | 'TECHNICIAN' | 'INVENTORY_MANAGER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type WorkshopProfile = {
  displayName: string;
  phone: string | null;
  address: string | null;
};

export type ActiveWorkshop = {
  workshopId: string;
  membershipId: string;
  name: string;
  role: UserRole;
  profile?: WorkshopProfile;
};

export type AuthTokenResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  activeWorkshop: ActiveWorkshop | null;
  requiresWorkshopSelection: boolean;
  requiresPasswordChange: boolean;
};

export type AuthSessionBootstrap = {
  user: AuthUser;
  activeWorkshop: ActiveWorkshop | null;
  requiresPasswordChange: boolean;
};

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

export class AuthRefreshSupersededError extends Error {
  constructor() {
    super('The refresh attempt was superseded by a newer session decision.');
    this.name = 'AuthRefreshSupersededError';
  }
}

type AuthBroadcastMessage =
  | { type: 'session'; response: AuthTokenResponse }
  | { type: 'logout'; reason: 'expired' | 'logout' };

const SESSION_RESTORE_TIMEOUT_MS = 5_000;
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const AUTH_BROADCAST_CHANNEL = 'racerlab-auth';
const AUTH_REFRESH_LOCK = 'racerlab-auth-refresh';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly accessTokenExpiresAtState = signal<number | null>(null);
  private readonly accessTokenSubjectState = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly activeWorkshopState = signal<ActiveWorkshop | null>(null);
  private readonly requiresPasswordChangeState = signal(false);
  private readonly sessionStateValue = signal<SessionState>('idle');
  private readonly profileStateValue = signal<ProfileState>('idle');
  private readonly sessionExpiredState = signal(false);
  private readonly sessionClosedState = signal(false);
  private readonly authChannel = this.createAuthChannel();
  private sessionRestoreInFlight$: Observable<SessionRestoreResult> | null = null;
  private refreshInFlight$: Observable<string> | null = null;
  private profileInFlight$: Observable<void> | null = null;
  private sessionGeneration = 0;
  private logoutPending = false;

  readonly isAuthenticated = computed(() => this.hasValidAccessToken());
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

  constructor() {
    this.authChannel?.addEventListener('message', this.handleAuthMessage);
  }

  ngOnDestroy(): void {
    this.authChannel?.removeEventListener('message', this.handleAuthMessage);
    this.authChannel?.close();
  }

  login(credentials: LoginRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.invalidatePendingSessionWork()),
        tap((response) => this.acceptTokenResponse(response)),
        tap((response) => this.broadcastSession(response)),
        tap(() => this.loadCurrentUserInBackground()),
        map(() => undefined),
      );
  }

  signup(identity: SignupRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/signup`, identity, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.invalidatePendingSessionWork()),
        tap((response) => this.acceptTokenResponse(response)),
        tap((response) => this.broadcastSession(response)),
        tap(() => this.loadCurrentUserInBackground()),
        map(() => undefined),
      );
  }

  ensureSession(forceRefresh = false): Observable<SessionRestoreResult> {
    if (!forceRefresh && this.hasValidAccessToken()) {
      this.sessionStateValue.set('authenticated');
      this.loadCurrentUserInBackground();
      return of('authenticated');
    }

    if (this.sessionRestoreInFlight$) {
      return this.sessionRestoreInFlight$;
    }

    this.sessionStateValue.set('restoring');

    const restoration$ = this.refreshAccessToken(
      forceRefresh ? (this.getAccessToken() ?? undefined) : undefined,
    ).pipe(
      tap(() => this.loadCurrentUserInBackground()),
      map(() => 'authenticated' as const),
      catchError((error: unknown) => {
        if (error instanceof AuthRefreshSupersededError) {
          return of(this.hasValidAccessToken() ? ('authenticated' as const) : ('anonymous' as const));
        }

        const kind = this.handleRefreshFailure(error);
        return of(kind === 'invalid' ? ('anonymous' as const) : ('unavailable' as const));
      }),
      finalize(() => {
        if (this.sessionRestoreInFlight$ === restoration$) {
          this.sessionRestoreInFlight$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.sessionRestoreInFlight$ = restoration$;
    return restoration$;
  }

  probeSession(): Observable<SessionRestoreResult> {
    if (this.hasValidAccessToken()) {
      return of('authenticated');
    }

    return this.refreshAccessToken().pipe(
      tap(() => this.loadCurrentUserInBackground()),
      map(() => 'authenticated' as const),
      catchError((error: unknown) => {
        if (error instanceof AuthRefreshSupersededError) {
          if (this.hasValidAccessToken()) {
            this.loadCurrentUserInBackground();
            return of('authenticated' as const);
          }

          return of('anonymous' as const);
        }

        const kind = this.handleSilentRefreshFailure(error);
        return of(kind === 'invalid' ? ('anonymous' as const) : ('unavailable' as const));
      }),
    );
  }

  refreshAccessToken(staleAccessToken?: string): Observable<string> {
    const currentToken = this.getAccessToken();
    if (!this.shouldRefresh(currentToken, staleAccessToken)) {
      return of(currentToken!);
    }

    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const generation = this.sessionGeneration;
    const refresh$ = defer(() => this.performCoordinatedRefresh(staleAccessToken, generation)).pipe(
      catchError((error: unknown) => {
        if (generation !== this.sessionGeneration) {
          try {
            return of(this.requireCompatibleReplacementToken(staleAccessToken));
          } catch (supersededError) {
            return throwError(() => supersededError);
          }
        }

        return throwError(() =>
          error instanceof AuthRefreshError || error instanceof AuthRefreshSupersededError
            ? error
            : new AuthRefreshError(this.classifyRefreshFailure(error), { cause: error }),
        );
      }),
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
    if (this.profileStateValue() === 'ready') {
      return of(undefined);
    }

    if (this.profileInFlight$) {
      return this.profileInFlight$;
    }

    this.profileStateValue.set('loading');
    const generation = this.sessionGeneration;
    const profile$ = this.http.get<AuthSessionBootstrap>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        if (generation !== this.sessionGeneration || !this.hasValidAccessToken()) {
          return;
        }

        this.userState.set(response.user);
        this.activeWorkshopState.set(response.activeWorkshop);
        this.requiresPasswordChangeState.set(response.requiresPasswordChange);
        this.profileStateValue.set('ready');
      }),
      map(() => undefined),
      catchError((error: HttpErrorResponse) => {
        if (generation !== this.sessionGeneration) {
          return of(undefined);
        }

        if (error.status === 401 || error.status === 403) {
          this.clearSession(false);
        } else {
          this.profileStateValue.set('error');
        }
        return of(undefined);
      }),
      finalize(() => {
        if (this.profileInFlight$ === profile$) {
          this.profileInFlight$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.profileInFlight$ = profile$;
    return profile$;
  }

  logout(): Observable<void> {
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
    this.logoutPending = true;
    this.clearSession(true, 'logout');
    return defer(() => this.performCoordinatedLogout()).pipe(
      finalize(() => {
        this.clearSession(true, 'logout');
        this.logoutPending = false;
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(() => this.requiresPasswordChangeState.set(false)));
  }

  applyTokenResponse(response: AuthTokenResponse): Observable<void> {
    this.invalidatePendingSessionWork();
    this.acceptTokenResponse(response);
    this.broadcastSession(response);
    this.loadCurrentUserInBackground();
    return of(undefined);
  }

  defaultAuthenticatedRoute(): string {
    if (this.requiresPasswordChange()) {
      return '/change-password';
    }

    return this.hasActiveWorkshop() ? '/dashboard' : '/workshops/select';
  }

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  hasValidAccessToken(): boolean {
    const accessToken = this.accessTokenState();
    const expiresAt = this.accessTokenExpiresAtState();
    return Boolean(accessToken && expiresAt && expiresAt > Date.now());
  }

  needsRefresh(windowMs = ACCESS_TOKEN_REFRESH_WINDOW_MS): boolean {
    const accessToken = this.accessTokenState();
    const expiresAt = this.accessTokenExpiresAtState();
    return !accessToken || !expiresAt || expiresAt - Date.now() <= windowMs;
  }

  handleRefreshFailure(error: unknown): RefreshFailureKind {
    const kind =
      error instanceof AuthRefreshError ? error.kind : this.classifyRefreshFailure(error);

    this.clearSession(kind === 'invalid', 'expired');
    this.sessionExpiredState.set(true);
    this.sessionClosedState.set(false);

    return kind;
  }

  private handleSilentRefreshFailure(error: unknown): RefreshFailureKind {
    const kind =
      error instanceof AuthRefreshError ? error.kind : this.classifyRefreshFailure(error);
    this.clearSession(false);
    return kind;
  }

  dismissSessionExpired(): void {
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
  }

  private async performCoordinatedRefresh(
    staleAccessToken: string | undefined,
    generation: number,
  ): Promise<string> {
    const refresh = async (): Promise<string> => {
      const replacementToken = this.validReplacementToken(generation, staleAccessToken);
      if (replacementToken !== undefined) {
        return replacementToken;
      }

      const currentToken = this.getAccessToken();
      if (!this.shouldRefresh(currentToken, staleAccessToken)) {
        return currentToken!;
      }

      const response = await firstValueFrom(
        this.http
          .post<AuthTokenResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
          .pipe(timeout(SESSION_RESTORE_TIMEOUT_MS)),
      );

      const tokenAfterRequest = this.validReplacementToken(generation, staleAccessToken);
      if (tokenAfterRequest !== undefined) {
        return tokenAfterRequest;
      }

      this.acceptTokenResponse(response);
      this.broadcastSession(response);
      return response.accessToken;
    };

    const lockManager = typeof navigator === 'undefined' ? undefined : navigator.locks;
    if (!lockManager) {
      return refresh();
    }

    const immediate = await lockManager.request(AUTH_REFRESH_LOCK, { ifAvailable: true }, (lock) =>
      lock ? refresh() : Promise.resolve(null),
    );
    if (immediate !== null) {
      return immediate;
    }

    return lockManager.request(AUTH_REFRESH_LOCK, async () => {
      await this.waitForCrossTabSession(staleAccessToken);
      return refresh();
    });
  }

  private async performCoordinatedLogout(): Promise<void> {
    const sendLogout = async (): Promise<void> => {
      await firstValueFrom(
        this.http
          .post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
          .pipe(timeout(SESSION_RESTORE_TIMEOUT_MS)),
      );
    };
    const lockManager = typeof navigator === 'undefined' ? undefined : navigator.locks;
    return lockManager ? lockManager.request(AUTH_REFRESH_LOCK, sendLogout) : sendLogout();
  }

  private validReplacementToken(
    generation: number,
    staleAccessToken?: string,
  ): string | undefined {
    if (generation === this.sessionGeneration) {
      return undefined;
    }

    return this.requireCompatibleReplacementToken(staleAccessToken);
  }

  private requireCompatibleReplacementToken(staleAccessToken?: string): string {
    const currentToken = this.getAccessToken();
    if (
      staleAccessToken &&
      currentToken &&
      this.hasValidAccessToken() &&
      this.hasSameAccessContext(staleAccessToken, currentToken)
    ) {
      return currentToken;
    }

    throw new AuthRefreshSupersededError();
  }

  private hasSameAccessContext(firstToken: string, secondToken: string): boolean {
    const first = this.readAccessTokenMetadata(firstToken);
    const second = this.readAccessTokenMetadata(secondToken);
    return Boolean(
      first &&
        second &&
        first.subject === second.subject &&
        first.workshopId === second.workshopId &&
        first.membershipId === second.membershipId,
    );
  }

  private shouldRefresh(currentToken: string | null, staleAccessToken?: string): boolean {
    if (staleAccessToken !== undefined) {
      return currentToken === staleAccessToken || !this.hasValidAccessToken();
    }

    return this.needsRefresh();
  }

  private acceptTokenResponse(response: AuthTokenResponse, clearOnFailure = true): void {
    const metadata = this.readAccessTokenMetadata(response?.accessToken);
    if (!metadata || metadata.expiresAt <= Date.now()) {
      if (clearOnFailure) {
        this.clearSession(false);
      }
      throw new AuthRefreshError('invalid');
    }

    const currentWorkshop = this.activeWorkshopState();
    const identityChanged = Boolean(
      metadata.subject &&
      this.accessTokenSubjectState() &&
      metadata.subject !== this.accessTokenSubjectState(),
    );
    const workshopChanged =
      currentWorkshop?.workshopId !== response.activeWorkshop?.workshopId ||
      currentWorkshop?.membershipId !== response.activeWorkshop?.membershipId;

    if (identityChanged) {
      this.userState.set(null);
      this.profileStateValue.set('idle');
    } else if (workshopChanged) {
      this.profileStateValue.set('idle');
    }

    const activeWorkshop =
      !identityChanged && !workshopChanged && currentWorkshop?.profile && response.activeWorkshop
        ? { ...response.activeWorkshop, profile: currentWorkshop.profile }
        : response.activeWorkshop;

    this.accessTokenState.set(response.accessToken);
    this.accessTokenExpiresAtState.set(metadata.expiresAt);
    this.accessTokenSubjectState.set(metadata.subject);
    this.activeWorkshopState.set(activeWorkshop);
    this.requiresPasswordChangeState.set(response.requiresPasswordChange);
    this.sessionStateValue.set('authenticated');
    this.sessionExpiredState.set(false);
    this.sessionClosedState.set(false);
  }

  private loadCurrentUserInBackground(): void {
    if (
      !this.hasValidAccessToken() ||
      this.profileStateValue() === 'ready' ||
      this.profileInFlight$
    ) {
      return;
    }

    this.loadCurrentUser().subscribe();
  }

  private readAccessTokenMetadata(
    accessToken: unknown,
  ): {
    expiresAt: number;
    subject: string | null;
    workshopId: string | null;
    membershipId: string | null;
  } | null {
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      return null;
    }

    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded)) as {
        exp?: unknown;
        sub?: unknown;
        wid?: unknown;
        mid?: unknown;
      };
      return typeof decoded.exp === 'number' && Number.isFinite(decoded.exp)
        ? {
            expiresAt: decoded.exp * 1000,
            subject: typeof decoded.sub === 'string' && decoded.sub ? decoded.sub : null,
            workshopId: typeof decoded.wid === 'string' && decoded.wid ? decoded.wid : null,
            membershipId: typeof decoded.mid === 'string' && decoded.mid ? decoded.mid : null,
          }
        : null;
    } catch {
      return null;
    }
  }

  private classifyRefreshFailure(error: unknown): RefreshFailureKind {
    if (error instanceof TimeoutError) {
      return 'unavailable';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return 'unavailable';
    }

    if (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500) {
      return 'unavailable';
    }

    return 'invalid';
  }

  private clearSession(broadcast: boolean, broadcastReason: 'expired' | 'logout' = 'logout'): void {
    this.invalidatePendingSessionWork();
    this.accessTokenState.set(null);
    this.accessTokenExpiresAtState.set(null);
    this.accessTokenSubjectState.set(null);
    this.userState.set(null);
    this.activeWorkshopState.set(null);
    this.requiresPasswordChangeState.set(false);
    this.sessionStateValue.set('anonymous');
    this.profileStateValue.set('idle');

    if (broadcast) {
      this.authChannel?.postMessage({
        type: 'logout',
        reason: broadcastReason,
      } satisfies AuthBroadcastMessage);
    }
  }

  private broadcastSession(response: AuthTokenResponse): void {
    this.authChannel?.postMessage({ type: 'session', response } satisfies AuthBroadcastMessage);
  }

  private readonly handleAuthMessage = (event: MessageEvent<AuthBroadcastMessage>): void => {
    if (event.data?.type === 'logout') {
      this.clearSession(false);
      this.sessionExpiredState.set(event.data.reason === 'expired');
      this.sessionClosedState.set(event.data.reason === 'logout');
      return;
    }

    if (event.data?.type === 'session') {
      if (this.logoutPending) {
        return;
      }

      try {
        this.invalidatePendingSessionWork();
        this.acceptTokenResponse(event.data.response, false);
        this.loadCurrentUserInBackground();
      } catch {
        // Ignore malformed cross-tab messages instead of replacing a valid local session.
      }
    }
  };

  private createAuthChannel(): BroadcastChannel | null {
    return typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  }

  private invalidatePendingSessionWork(): void {
    this.sessionGeneration += 1;
    this.sessionRestoreInFlight$ = null;
    this.refreshInFlight$ = null;
    this.profileInFlight$ = null;
  }

  private waitForCrossTabSession(staleAccessToken?: string): Promise<void> {
    const channel = this.authChannel;
    if (!channel || !this.shouldRefresh(this.getAccessToken(), staleAccessToken)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const finish = (): void => {
        clearTimeout(timeoutId);
        channel.removeEventListener('message', onMessage);
        resolve();
      };
      const onMessage = (event: MessageEvent<AuthBroadcastMessage>): void => {
        if (event.data?.type === 'session' || event.data?.type === 'logout') {
          finish();
        }
      };

      channel.addEventListener('message', onMessage);
      timeoutId = setTimeout(finish, 100);
      if (!this.shouldRefresh(this.getAccessToken(), staleAccessToken)) {
        finish();
      }
    });
  }
}
