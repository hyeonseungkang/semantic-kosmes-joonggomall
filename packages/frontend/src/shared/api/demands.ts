import { apiClient } from './client';
import type { DemandDto, CreateDemandDto } from '@kosmes/shared';

export const demandsApi = {
  create: (dto: CreateDemandDto) =>
    apiClient.post('/demands', dto).then((r) => r.data),

  getMyDemands: () =>
    apiClient.get<DemandDto[]>('/demands').then((r) => r.data),

  getMatches: (id: string) =>
    apiClient.get(`/demands/${id}/matches`).then((r) => r.data),

  cancel: (id: string) => apiClient.delete(`/demands/${id}`),
};
