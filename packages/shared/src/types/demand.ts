import { GeoPoint } from './geo';
import { ExtractedSpec } from './listing';

export type DemandStatus = 'waiting' | 'matched' | 'expired';
export type NotifyChannel = 'push' | 'kakao' | 'email';

export interface DemandDto {
  id: string;
  buyerId: string;
  queryText: string;
  extractedSpec?: ExtractedSpec;
  location?: GeoPoint;
  radiusKm: number;
  status: DemandStatus;
  notifyChannel: NotifyChannel;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateDemandDto {
  queryText: string;
  location: GeoPoint;
  radiusKm?: number;
  notifyChannel?: NotifyChannel;
  expiresAt?: string;
}
