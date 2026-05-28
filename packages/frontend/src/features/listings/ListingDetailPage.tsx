import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../../shared/api/listings';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (isError || !listing) return <div className="p-8 text-center text-red-500">매물을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/search" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← 목록으로</Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">{listing.title}</h1>

      {/* 가격 */}
      <div className="flex items-center gap-4 mb-6">
        {listing.price ? (
          <span className="text-2xl font-bold text-blue-600">{listing.price.toLocaleString()}원</span>
        ) : (
          <span className="text-gray-500">가격 협의</span>
        )}
        {listing.condition && (
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {listing.condition === 'used' ? '중고' : listing.condition === 'new' ? '신품' : '재생'}
          </span>
        )}
      </div>

      {/* 스펙 테이블 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">상세 스펙</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {listing.voltage && (
            <>
              <dt className="text-gray-500">전압</dt>
              <dd className="font-medium">{listing.voltage}V</dd>
            </>
          )}
          {listing.powerKw && (
            <>
              <dt className="text-gray-500">출력</dt>
              <dd className="font-medium">{listing.powerKw}kW</dd>
            </>
          )}
          {listing.weightKg && (
            <>
              <dt className="text-gray-500">무게</dt>
              <dd className="font-medium">{listing.weightKg}kg</dd>
            </>
          )}
          {listing.locationText && (
            <>
              <dt className="text-gray-500">위치</dt>
              <dd className="font-medium">{listing.locationText}</dd>
            </>
          )}
          {listing.categoryL1 && (
            <>
              <dt className="text-gray-500">카테고리</dt>
              <dd className="font-medium">{listing.categoryL1}{listing.categoryL2 ? ` > ${listing.categoryL2}` : ''}</dd>
            </>
          )}
        </dl>
      </div>

      {/* 상세 설명 */}
      {listing.description && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">상세 설명</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
        </div>
      )}

      {/* AI 추출 키워드 */}
      {listing.extractedSpec?.keywords?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {listing.extractedSpec.keywords.map((kw) => (
            <span key={kw} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}
