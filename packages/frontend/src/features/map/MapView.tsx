import { useEffect, useRef } from 'react';
import type { GeoPoint, ListingMapPinDto } from '@kosmes/shared';

interface Props {
  center: GeoPoint;
  radiusKm: number;
  pins: ListingMapPinDto[];
  onPinClick?: (id: string) => void;
}

declare global {
  interface Window {
    kakao: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (opts: object) => KakaoMarker;
        Circle: new (opts: object) => { setMap: (m: KakaoMap | null) => void };
        InfoWindow: new (opts: object) => KakaoInfoWindow;
        event: { addListener: (target: object, type: string, fn: () => void) => void };
        MarkerClusterer: new (opts: object) => { addMarkers: (ms: KakaoMarker[]) => void; clear: () => void };
      };
    };
  }
}

type KakaoMap = { setCenter: (l: KakaoLatLng) => void };
type KakaoLatLng = object;
type KakaoMarker = { setMap: (m: KakaoMap | null) => void; getPosition: () => KakaoLatLng };
type KakaoInfoWindow = { open: (m: KakaoMap, mk: KakaoMarker) => void; close: () => void };

export function MapView({ center, radiusKm, pins, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const clustererRef = useRef<{ addMarkers: (ms: KakaoMarker[]) => void; clear: () => void } | null>(null);
  const circleRef = useRef<{ setMap: (m: KakaoMap | null) => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !window.kakao) return;
    const { kakao } = window;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 8,
    });
    mapRef.current = map;
    clustererRef.current = new kakao.maps.MarkerClusterer({ map, averageCenter: true, minLevel: 6 });
  }, []);

  // Update center & radius circle
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;
    const pos = new kakao.maps.LatLng(center.lat, center.lng);
    mapRef.current.setCenter(pos);

    if (circleRef.current) circleRef.current.setMap(null);
    circleRef.current = new kakao.maps.Circle({
      center: pos,
      radius: radiusKm * 1000,
      strokeWeight: 2,
      strokeColor: '#1e6fdb',
      strokeOpacity: 0.8,
      fillColor: '#1e6fdb',
      fillOpacity: 0.05,
      map: mapRef.current,
    });
  }, [center, radiusKm]);

  // Update pins
  useEffect(() => {
    if (!mapRef.current || !window.kakao || !clustererRef.current) return;
    const { kakao } = window;
    clustererRef.current.clear();

    const markers = pins
      .filter((p) => p.lat && p.lng)
      .map((p) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(p.lat, p.lng),
          title: p.title,
        });
        const iw = new kakao.maps.InfoWindow({
          content: `
            <div style="padding:8px;min-width:160px;font-size:13px">
              <strong style="display:block;margin-bottom:4px">${p.title}</strong>
              ${p.price ? `<span>${p.price.toLocaleString()}원</span><br/>` : ''}
              ${p.scoreTotal ? `<span style="color:#1e6fdb">유사도 ${(p.scoreTotal * 100).toFixed(0)}%</span>` : ''}
              <br/><a href="/listings/${p.id}" style="color:#1e6fdb;text-decoration:underline">상세보기</a>
            </div>
          `,
        });
        kakao.maps.event.addListener(marker, 'click', () => {
          iw.open(mapRef.current!, marker);
          onPinClick?.(p.id);
        });
        return marker;
      });

    clustererRef.current.addMarkers(markers);
  }, [pins, onPinClick]);

  return <div ref={containerRef} className="w-full h-full" />;
}
