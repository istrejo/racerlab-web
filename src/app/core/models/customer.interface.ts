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
  page?: number;
  limit?: number;
};
