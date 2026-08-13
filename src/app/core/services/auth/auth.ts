import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  switchMap,
  tap,
  timeout,
} from 'rxjs';
import { API_URL } from '@shared/utils/api-url.token';

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

export type SessionBootstrapState = 'idle' | 'loading' | 'ready' | 'error';

const SESSION_RESTORE_TIMEOUT_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly accessToken = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly activeWorkshopState = signal<ActiveWorkshop | null>(null);
  private readonly requiresPasswordChangeState = signal(false);
  private readonly bootstrapState = signal<SessionBootstrapState>('idle');

  readonly isAuthenticated = computed(() => this.hasAccessToken(this.accessToken()));
  readonly user = this.userState.asReadonly();
  readonly activeWorkshop = this.activeWorkshopState.asReadonly();
  readonly profile = computed(() => this.activeWorkshopState()?.profile ?? null);
  readonly hasActiveWorkshop = computed(() => this.activeWorkshopState() !== null);
  readonly role = computed(() => this.activeWorkshopState()?.role ?? null);
  readonly requiresPasswordChange = this.requiresPasswordChangeState.asReadonly();
  readonly sessionBootstrapState = this.bootstrapState.asReadonly();
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
      .pipe(switchMap((response) => this.applyTokenResponse(response)));
  }

  signup(identity: SignupRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/signup`, identity, {
        withCredentials: true,
      })
      .pipe(switchMap((response) => this.applyTokenResponse(response)));
  }

  async restoreSession(): Promise<void> {
    await firstValueFrom(
      this.http
        .post<AuthTokenResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          timeout(SESSION_RESTORE_TIMEOUT_MS),
          switchMap((response) => this.applyTokenResponse(response)),
          catchError(() => {
            this.clearSession();
            return of(undefined);
          }),
        ),
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => this.clearSession()));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(() => this.requiresPasswordChangeState.set(false)));
  }

  applyTokenResponse(response: AuthTokenResponse): Observable<void> {
    this.storeAccessToken(response);
    return this.isAuthenticated() ? this.bootstrapSession() : of(undefined);
  }

  bootstrapSession(): Observable<void> {
    this.bootstrapState.set('loading');

    return this.http.get<AuthSessionBootstrap>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        this.userState.set(response.user);
        this.activeWorkshopState.set(response.activeWorkshop);
        this.requiresPasswordChangeState.set(response.requiresPasswordChange);
        this.bootstrapState.set('ready');
      }),
      map(() => undefined),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearSession();
        } else {
          this.bootstrapState.set('error');
        }
        return of(undefined);
      }),
    );
  }

  defaultAuthenticatedRoute(): string {
    if (this.requiresPasswordChange()) {
      return '/change-password';
    }

    return this.hasActiveWorkshop() ? '/dashboard' : '/workshops/select';
  }

  getAccessToken(): string | null {
    const accessToken = this.accessToken();
    return this.hasAccessToken(accessToken) ? accessToken : null;
  }

  private storeAccessToken(response: AuthTokenResponse): void {
    if (!this.hasAccessToken(response?.accessToken)) {
      this.clearSession();
      return;
    }

    this.accessToken.set(response.accessToken);
    this.activeWorkshopState.set(response.activeWorkshop);
    this.requiresPasswordChangeState.set(response.requiresPasswordChange);
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.userState.set(null);
    this.activeWorkshopState.set(null);
    this.requiresPasswordChangeState.set(false);
    this.bootstrapState.set('idle');
  }

  private hasAccessToken(accessToken: string | null | undefined): accessToken is string {
    return typeof accessToken === 'string' && accessToken.trim().length > 0;
  }
}
