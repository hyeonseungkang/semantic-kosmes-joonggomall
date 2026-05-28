import { apiClient } from './client';
import type { SearchRequestDto, SearchResponseDto } from '@kosmes/shared';

export const searchApi = {
  search: (dto: SearchRequestDto) =>
    apiClient.post<SearchResponseDto>('/search', dto).then((r) => r.data),
};
