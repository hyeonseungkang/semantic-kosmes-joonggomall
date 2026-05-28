import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { demandsApi } from '../../shared/api/demands';
import type { DemandDto } from '@kosmes/shared';

const STATUS_LABEL: Record<string, string> = {
  waiting: '대기 중',
  matched: '매칭 완료',
  expired: '만료',
};

export function MyDemandsPage() {
  const qc = useQueryClient();
  const { data: demands, isLoading } = useQuery({
    queryKey: ['my-demands'],
    queryFn: demandsApi.getMyDemands,
  });

  const cancelMutation = useMutation({
    mutationFn: demandsApi.cancel,
    onSuccess: () => {
      toast.success('수요가 취소되었습니다.');
      qc.invalidateQueries({ queryKey: ['my-demands'] });
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">내 구매 수요</h1>
        <Link to="/demands/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + 수요 등록
        </Link>
      </div>

      {(!demands || demands.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <p>등록된 수요가 없습니다.</p>
          <Link to="/demands/new" className="text-blue-600 hover:underline mt-2 inline-block">수요 등록하기</Link>
        </div>
      )}

      <ul className="space-y-3">
        {demands?.map((demand: DemandDto) => (
          <li key={demand.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{demand.queryText}</p>
              <span className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                demand.status === 'matched' ? 'bg-green-100 text-green-700' :
                demand.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {STATUS_LABEL[demand.status]}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>반경 {demand.radiusKm}km</span>
              <span>{new Date(demand.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2 mt-3">
              {demand.status === 'matched' && (
                <Link to={`/demands/${demand.id}/matches`} className="text-xs text-blue-600 border border-blue-600 px-3 py-1 rounded-md hover:bg-blue-50">
                  매칭 결과 보기
                </Link>
              )}
              {demand.status === 'waiting' && (
                <button
                  onClick={() => cancelMutation.mutate(demand.id)}
                  className="text-xs text-red-500 border border-red-300 px-3 py-1 rounded-md hover:bg-red-50"
                >
                  취소
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
