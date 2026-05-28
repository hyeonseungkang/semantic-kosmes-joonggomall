import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSearchStore } from '../../shared/store/searchStore';
import { searchApi } from '../../shared/api/search';
import { SearchResultList } from './SearchResultList';
import { MapView } from '../map/MapView';
import { FilterPanel } from './FilterPanel';

export function SearchPage() {
  const { query, location, radiusKm, filters, result, isSearching,
    setQuery, setLocation, setRadiusKm, setResult, setIsSearching } = useSearchStore();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }
    if (!location) {
      toast.error('위치를 설정해주세요.');
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchApi.search({ query, location, radiusKm, filters });
      setResult(data);
      if (data.results.length === 0) {
        toast('해당 조건의 매물이 없습니다. 수요를 등록하시면 알림을 받으실 수 있습니다.', { icon: 'ℹ️' });
      }
    } catch {
      toast.error('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, [query, location, radiusKm, filters, setIsSearching, setResult]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('현재 위치가 설정되었습니다.');
      },
      () => toast.error('위치 정보를 가져올 수 없습니다.'),
    );
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* 좌측 검색 패널 */}
      <div className="w-[420px] flex flex-col bg-white border-r border-gray-200 overflow-hidden">
        <div className="p-4 space-y-3 border-b border-gray-100">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 소형 에어샤워 220V 1~2인용 원합니다"
            className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleSearch()}
          />

          {/* 위치 설정 */}
          <div className="flex gap-2">
            <button
              onClick={handleGetCurrentLocation}
              className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
            >
              📍 현재 위치
            </button>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-md px-2 py-2"
            >
              {[10, 30, 50, 100].map((r) => (
                <option key={r} value={r}>{r}km</option>
              ))}
            </select>
          </div>

          {location && (
            <p className="text-xs text-gray-500">
              위치: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}

          {/* 필터 토글 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showFilters ? '▲ 필터 접기' : '▼ 상세 필터'}
          </button>
          {showFilters && <FilterPanel />}

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? '검색 중...' : '🔍 검색'}
          </button>
        </div>

        {/* 결과 목록 */}
        <div className="flex-1 overflow-y-auto">
          {result && result.results.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-3">매칭된 매물이 없습니다.</p>
              <button
                onClick={() => navigate('/demands/new', { state: { query, location, radiusKm } })}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
              >
                수요 등록하고 알림 받기
              </button>
            </div>
          )}
          {result && <SearchResultList results={result.results} />}
        </div>
      </div>

      {/* 우측 지도 */}
      <div className="flex-1">
        <MapView
          center={location ?? { lat: 37.5665, lng: 126.978 }}
          radiusKm={radiusKm}
          pins={result?.results.map((r) => ({
            id: r.listing.id,
            lat: r.listing.location?.lat ?? 0,
            lng: r.listing.location?.lng ?? 0,
            title: r.listing.title,
            price: r.listing.price,
            scoreTotal: r.scoreTotal,
          })) ?? []}
        />
      </div>
    </div>
  );
}
