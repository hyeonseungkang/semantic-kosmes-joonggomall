export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Dimensions {
  l: number;
  w: number;
  h: number;
  unit: 'mm' | 'cm' | 'm';
}
