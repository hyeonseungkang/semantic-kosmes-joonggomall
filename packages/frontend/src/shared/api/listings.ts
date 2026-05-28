import { apiClient } from './client';
import type { ListingDto, CreateListingDto } from '@kosmes/shared';

export const listingsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<{ items: ListingDto[]; total: number }>('/listings', { params }).then((r) => r.data),

  getOne: (id: string) => apiClient.get<ListingDto>(`/listings/${id}`).then((r) => r.data),

  getMapPins: (lat: number, lng: number, radius = 50) =>
    apiClient.get('/listings/map', { params: { lat, lng, radius } }).then((r) => r.data),

  create: (dto: CreateListingDto) =>
    apiClient.post<ListingDto>('/listings', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateListingDto>) =>
    apiClient.patch<ListingDto>(`/listings/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/listings/${id}`),
};
