import { UserRole } from './auth.interface';

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
