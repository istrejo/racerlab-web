import { QuoteItemType } from '@core/models/quotes.interface';

export const QUOTE_ITEM_TYPES: readonly QuoteItemType[] = ['PART', 'LABOR', 'SERVICE', 'OTHER'];

export const QUOTE_ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  PART: 'Repuesto',
  LABOR: 'Mano de obra',
  SERVICE: 'Servicio',
  OTHER: 'Otro',
};
