import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '@shared/utils/api-url.token';
import { Observable } from 'rxjs';
import { UserRole } from '../auth/auth';

export type Membership = {
  id: string;
  workshopId: string;
  role: UserRole;
  name: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateMembershipRequest = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: Exclude<UserRole, 'OWNER'>;
  password: string;
};

export type UpdateMembershipRequest = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  role?: Exclude<UserRole, 'OWNER'>;
  isActive?: boolean;
};

@Injectable({ providedIn: 'root' })
export class MembershipsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<Membership[]> {
    return this.http.get<Membership[]>(`${this.apiUrl}/memberships`);
  }

  get(id: string): Observable<Membership> {
    return this.http.get<Membership>(`${this.apiUrl}/memberships/${id}`);
  }

  create(request: CreateMembershipRequest): Observable<Membership> {
    return this.http.post<Membership>(`${this.apiUrl}/memberships`, request);
  }

  update(id: string, request: UpdateMembershipRequest): Observable<Membership> {
    return this.http.patch<Membership>(`${this.apiUrl}/memberships/${id}`, request);
  }

  resetPassword(id: string, temporaryPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/memberships/${id}/reset-password`, {
      temporaryPassword,
    });
  }
}

export const assignableRoles: ReadonlyArray<Exclude<UserRole, 'OWNER'>> = [
  'ADMIN',
  'MANAGER',
  'ADVISOR',
  'TECHNICIAN',
  'INVENTORY_MANAGER',
];

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    MANAGER: 'Responsable',
    ADVISOR: 'Asesor',
    TECHNICIAN: 'Técnico',
    INVENTORY_MANAGER: 'Responsable de inventario',
  };

  return labels[role];
}
