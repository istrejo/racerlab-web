import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { map, Observable, switchMap } from 'rxjs';
import { AuthService, AuthTokenResponse } from '../auth/auth';

export type CreateWorkshopRequest = {
  name: string;
};

@Injectable({ providedIn: 'root' })
export class WorkshopsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly auth = inject(AuthService);

  create(request: CreateWorkshopRequest): Observable<AuthTokenResponse> {
    return this.http
      .post<AuthTokenResponse>(`${this.apiUrl}/workshops`, request)
      .pipe(
        switchMap((response) => this.auth.applyTokenResponse(response).pipe(map(() => response))),
      );
  }
}
