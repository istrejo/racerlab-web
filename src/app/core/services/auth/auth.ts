import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, firstValueFrom, map, Observable, of, tap, timeout } from 'rxjs';
import { API_URL } from '@shared/utils/api-url.token';

export type LoginRequest = {
  email: string;
  password: string;
};

export type UserRole =
  'OWNER' | 'ADMIN' | 'MANAGER' | 'ADVISOR' | 'TECHNICIAN' | 'INVENTORY_MANAGER';

export type ActiveWorkshop = {
  workshopId: string;
  membershipId: string;
  name: string;
  role: UserRole;
};

export type AuthTokenResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  activeWorkshop: ActiveWorkshop | null;
  requiresWorkshopSelection: boolean;
  requiresPasswordChange: boolean;
};

const SESSION_RESTORE_TIMEOUT_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly accessToken = signal<string | null>(null);
  private readonly activeWorkshopState = signal<ActiveWorkshop | null>(null);
  private readonly requiresPasswordChangeState = signal(false);

  readonly isAuthenticated = computed(() => this.hasAccessToken(this.accessToken()));
  readonly activeWorkshop = this.activeWorkshopState.asReadonly();
  readonly hasActiveWorkshop = computed(() => this.activeWorkshopState() !== null);
  readonly role = computed(() => this.activeWorkshopState()?.role ?? null);
  readonly requiresPasswordChange = this.requiresPasswordChangeState.asReadonly();
  readonly canManageUsers = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'OWNER';
  });

  login(credentials: LoginRequest): Observable<void> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.storeAccessToken(response)),
        map(() => undefined),
      );
  }

  async restoreSession(): Promise<void> {
    await firstValueFrom(
      this.http
        .post<AuthTokenResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          timeout(SESSION_RESTORE_TIMEOUT_MS),
          tap((response) => this.storeAccessToken(response)),
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

  applyTokenResponse(response: AuthTokenResponse): void {
    this.storeAccessToken(response);
  }

  defaultAuthenticatedRoute(): string {
    if (this.requiresPasswordChange()) {
      return '/change-password';
    }

    return this.hasActiveWorkshop() ? '/dashboard' : '/workshops/new';
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
    this.activeWorkshopState.set(null);
    this.requiresPasswordChangeState.set(false);
  }

  private hasAccessToken(accessToken: string | null | undefined): accessToken is string {
    return typeof accessToken === 'string' && accessToken.trim().length > 0;
  }
}
