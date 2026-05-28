import { GeoPoint } from './geo';
import { ListingDto } from './listing';

export interface HardFilter {
  voltage?: number;
  categoryL1?: string;
  categoryL2?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface SearchRequestDto {
  query: string;
  location: GeoPoint;
  radiusKm?: number;
  filters?: HardFilter;
  topK?: number;
}

export interface SearchResultItem {
  listing: ListingDto;
  scoreTotal: number;
  scoreVector: number;
  scoreGeo: number;
  distanceKm: number;
}

export interface SearchResponseDto {
  results: SearchResultItem[];
  total: number;
  demandId?: string;
}
