import { GeoPoint, Dimensions } from './geo';

export type ListingStatus = 'active' | 'sold' | 'expired';
export type ListingCondition = 'new' | 'used' | 'refurbished';
export type PriceType = 'fixed' | 'negotiable' | 'unknown';

export interface ExtractedSpec {
  category_l1: string | null;
  category_l2: string | null;
  keywords: string[];
  voltage_v: number | null;
  power_kw: number | null;
  dimensions: Dimensions | null;
  weight_kg: number | null;
  condition: ListingCondition | null;
  quantity: number | null;
}

export interface ListingDto {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  categoryL1?: string;
  categoryL2?: string;
  price?: number;
  priceType: PriceType;
  voltage?: number;
  powerKw?: number;
  weightKg?: number;
  dimensions?: Dimensions;
  condition?: ListingCondition;
  locationText?: string;
  location?: GeoPoint;
  status: ListingStatus;
  extractedSpec?: ExtractedSpec;
  imageUrls?: string[];
  sellerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingDto {
  title: string;
  description?: string;
  categoryL1?: string;
  categoryL2?: string;
  price?: number;
  priceType?: PriceType;
  voltage?: number;
  powerKw?: number;
  weightKg?: number;
  dimensions?: Dimensions;
  condition?: ListingCondition;
  locationText?: string;
  location?: GeoPoint;
}

export interface ListingMapPinDto {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price?: number;
  scoreTotal?: number;
}
