import { Injectable, signal } from '@angular/core';
import type { AccessTokenMetadata } from '../../model/auth.interface';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly accessTokenState = signal<string | null>(null);
  private readonly accessTokenMetadataState = signal<AccessTokenMetadata | null>(null);

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  getSubject(): string | null {
    return this.accessTokenMetadataState()?.subject ?? null;
  }

  setAccessToken(accessToken: string, metadata: AccessTokenMetadata): void {
    this.accessTokenState.set(accessToken);
    this.accessTokenMetadataState.set(metadata);
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.accessTokenMetadataState.set(null);
  }

  hasValidAccessToken(): boolean {
    const accessToken = this.accessTokenState();
    const expiresAt = this.accessTokenMetadataState()?.expiresAt;
    return Boolean(accessToken && expiresAt && expiresAt > Date.now());
  }

  needsRefresh(windowMs = ACCESS_TOKEN_REFRESH_WINDOW_MS): boolean {
    const accessToken = this.accessTokenState();
    const expiresAt = this.accessTokenMetadataState()?.expiresAt;
    return !accessToken || !expiresAt || expiresAt - Date.now() <= windowMs;
  }

  hasSameAccessContext(firstToken: string, secondToken: string): boolean {
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

  readAccessTokenMetadata(accessToken: unknown): AccessTokenMetadata | null {
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
}
