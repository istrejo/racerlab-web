import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly accessTokenState = signal<string | null>(null);

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  setAccessToken(accessToken: string): void {
    this.accessTokenState.set(accessToken);
  }

  clear(): void {
    this.accessTokenState.set(null);
  }

  hasAccessToken(): boolean {
    return this.accessTokenState() !== null;
  }
}
