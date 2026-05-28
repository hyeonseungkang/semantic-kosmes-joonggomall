import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GeoPoint } from '@kosmes/shared';

// 행정구역 중심점 오프라인 폴백 (시/도 수준)
const REGION_FALLBACK: Record<string, GeoPoint> = {
  서울: { lat: 37.5665, lng: 126.978 },
  경기: { lat: 37.4138, lng: 127.5183 },
  인천: { lat: 37.4563, lng: 126.7052 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  충북: { lat: 36.8, lng: 127.7 },
  충남: { lat: 36.5184, lng: 126.8 },
  전북: { lat: 35.7175, lng: 127.153 },
  전남: { lat: 34.8679, lng: 126.991 },
  경북: { lat: 36.4919, lng: 128.8889 },
  경남: { lat: 35.4606, lng: 128.2132 },
  강원: { lat: 37.8228, lng: 128.1555 },
  제주: { lat: 33.4996, lng: 126.5312 },
};

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly cache = new Map<string, GeoPoint | null>();

  constructor(private readonly config: ConfigService) {}

  async geocode(address: string): Promise<GeoPoint | null> {
    const cacheKey = address.trim().toLowerCase();
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    let result = await this.geocodeKakao(address);
    if (!result) result = this.geocodeFallback(address);

    this.cache.set(cacheKey, result);
    return result;
  }

  private async geocodeKakao(address: string): Promise<GeoPoint | null> {
    const apiKey = this.config.get<string>('KAKAO_MAP_REST_API_KEY');
    if (!apiKey) return null;
    try {
      const { data } = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        params: { query: address },
        timeout: 3000,
      });
      const doc = data?.documents?.[0];
      if (!doc) return null;
      return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
    } catch (e) {
      this.logger.warn(`Kakao geocode failed for "${address}": ${(e as Error).message}`);
      return null;
    }
  }

  private geocodeFallback(address: string): GeoPoint | null {
    for (const [key, point] of Object.entries(REGION_FALLBACK)) {
      if (address.includes(key)) return point;
    }
    return null;
  }

  haversineDistance(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }
}
