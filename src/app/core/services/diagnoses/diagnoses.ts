import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';
import { Diagnosis } from '@core/models/diagnoses.interface';

export type DiagnosisInput = {
  description: string;
  requiredPartsNotes?: string | null;
  suggestedLabor?: string | null;
};

@Injectable({ providedIn: 'root' })
export class DiagnosesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private base(serviceOrderId: string): string {
    return `${this.apiUrl}/service-orders/${serviceOrderId}/diagnoses`;
  }

  list(serviceOrderId: string): Observable<Diagnosis[]> {
    return this.http.get<Diagnosis[]>(this.base(serviceOrderId));
  }

  get(serviceOrderId: string, diagnosisId: string): Observable<Diagnosis> {
    return this.http.get<Diagnosis>(`${this.base(serviceOrderId)}/${diagnosisId}`);
  }

  create(serviceOrderId: string, input: DiagnosisInput): Observable<Diagnosis> {
    return this.http.post<Diagnosis>(this.base(serviceOrderId), input);
  }

  update(
    serviceOrderId: string,
    diagnosisId: string,
    input: Partial<DiagnosisInput>,
  ): Observable<Diagnosis> {
    return this.http.patch<Diagnosis>(`${this.base(serviceOrderId)}/${diagnosisId}`, input);
  }

  remove(serviceOrderId: string, diagnosisId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(serviceOrderId)}/${diagnosisId}`);
  }
}
