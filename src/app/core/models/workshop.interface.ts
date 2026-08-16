import { UserRole } from './auth.interface';

export type CreateWorkshopRequest = {
  name: string;
};

export type WorkshopSummary = {
  id: string;
  name: string;
  ownerUserId: string;
  membershipId: string;
  role: UserRole;
};
