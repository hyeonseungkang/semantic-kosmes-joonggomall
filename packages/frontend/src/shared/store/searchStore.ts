import { create } from 'zustand';
import type { GeoPoint, SearchResponseDto, HardFilter } from '@kosmes/shared';

interface SearchState {
  query: string;
  location: GeoPoint | null;
  radiusKm: number;
  filters: HardFilter;
  result: SearchResponseDto | null;
  isSearching: boolean;
  setQuery: (q: string) => void;
  setLocation: (loc: GeoPoint) => void;
  setRadiusKm: (r: number) => void;
  setFilters: (f: Partial<HardFilter>) => void;
  setResult: (r: SearchResponseDto | null) => void;
  setIsSearching: (v: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  location: null,
  radiusKm: 50,
  filters: {},
  result: null,
  isSearching: false,
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setResult: (result) => set({ result }),
  setIsSearching: (isSearching) => set({ isSearching }),
}));
