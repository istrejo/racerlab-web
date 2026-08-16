import {
  CustomerSummary,
  MemberSummary,
  ServiceOrderStatus,
  VehicleSummary,
} from './service-order.interface';

export type QuoteStatus = 'DRAFT' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type QuoteItemType = 'PART' | 'LABOR' | 'SERVICE' | 'OTHER';

export type QuoteItem = {
  id: string;
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice: number | null;
  total: number;
  inventoryProductId: string | null;
  isApproved: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type Quote = {
  id: string;
  serviceOrderId: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number | null;
  tax: number | null;
  total: number;
  approvalMethod: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdBy: MemberSummary;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteServiceOrderSummary = {
  id: string;
  code: string;
  status: ServiceOrderStatus;
};

export type QuoteSummary = {
  id: string;
  status: QuoteStatus;
  total: number;
  itemCount: number;
  serviceOrder: QuoteServiceOrderSummary;
  customer: CustomerSummary;
  vehicle: VehicleSummary;
  createdBy: MemberSummary;
  createdAt: string;
};

export type QuotePage = {
  items: QuoteSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type QuoteSearch = {
  search?: string;
  status?: QuoteStatus;
  serviceOrderId?: string;
  page?: number;
  limit?: number;
};

export type QuoteItemInput = {
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number | null;
};

export type QuoteInput = {
  items: QuoteItemInput[];
  discount?: number | null;
  tax?: number | null;
};

export type QuoteUpdate = Partial<QuoteInput>;

export type ChangeQuoteStatusInput = {
  status: QuoteStatus;
  approvalMethod?: string | null;
};
