export type Customer = {
  id: string;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  vehicleCount: number;
  serviceOrderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type CustomerPage = {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerSearch = {
  search?: string;
  hasVehicles?: boolean;
  hasServiceOrders?: boolean;
  sort?: CustomerSort;
  page?: number;
  limit?: number;
};

export type CustomerSort = 'NAME_ASC' | 'NAME_DESC' | 'NEWEST' | 'OLDEST';
