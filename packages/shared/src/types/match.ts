export interface MatchDto {
  id: string;
  demandId: string;
  listingId: string;
  scoreVector: number;
  scoreGeo: number;
  scoreTotal: number;
  distanceKm: number;
  notifiedAt?: string;
  createdAt: string;
}
