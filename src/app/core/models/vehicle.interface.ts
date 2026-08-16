import { CustomerSummary } from './service-order.interface';

export type Vehicle = {
  id: string;
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  vehicleType: string | null;
  notes: string | null;
  serviceOrderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type VehicleInput = {
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string | null;
  vin?: string | null;
  mileage?: number | null;
  vehicleType?: string | null;
  notes?: string | null;
};

export type VehiclePage = {
  items: Vehicle[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type VehicleWithCustomer = Vehicle & {
  customer: CustomerSummary;
};

export type VehicleWithCustomerPage = {
  items: VehicleWithCustomer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type VehicleSearch = {
  search?: string;
  page?: number;
  limit?: number;
};
