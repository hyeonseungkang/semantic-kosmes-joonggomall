import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { demandsApi } from '../../shared/api/demands';
import type { CreateDemandDto, GeoPoint } from '@kosmes/shared';

export function DemandRegisterPage() {
  const locationState = useLocation().state as { query?: string; location?: GeoPoint; radiusKm?: number } | null;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, setValue } = useForm<CreateDemandDto>({
    defaultValues: {
      queryText: locationState?.query ?? '',
      radiusKm: locationState?.radiusKm ?? 50,
      notifyChannel: 'push',
      location: locationState?.location ?? { lat: 0, lng: 0 },
    },
  });

  const mutation = useMutation({
    mutationFn: demandsApi.create,
    onSuccess: (data) => {
      const { demand, searchResult } = data as { demand: { id: string }; searchResult: { results: unknown[] } };
      if (searchResult.results.length > 0) {
        toast.success('매칭된 매물이 있습니다!');
        navigate(`/demands/${demand.id}/matches`);
      } else {
        toast.success('수요가 등록되었습니다. 새 매물 등록 시 알림을 보내드립니다.');
        navigate('/demands');
      }
    },
    onError: () => toast.error('수요 등록에 실패했습니다.'),
  });

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('위치가 설정되었습니다.');
      },
      () => toast.error('위치를 가져올 수 없습니다.'),
    );
  };

  const location = watch('location');
  const queryText = watch('queryText');

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold mb-2">구매 수요 등록</h1>
      <p className="text-sm text-gray-500 mb-6">원하는 장비를 자연어로 입력하시면 AI가 분석하여 매칭해 드립니다.</p>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Step 1 — 요구사항 입력</h2>
            <textarea
              {...register('queryText', { required: true })}
              rows={5}
              placeholder="예: 소형 에어샤워 220V 1~2인용, HACCP 인증용 위생 장비"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => setStep(2)} disabled={!queryText?.trim()} className="w-full bg-blue-600 text-white py-2.5 rounded-lg disabled:opacity-50">
              다음
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Step 2 — 위치 설정</h2>
            <button type="button" onClick={handleGetCurrentLocation} className="w-full border border-gray-300 rounded-md py-2 text-sm hover:bg-gray-50">
              📍 현재 위치 사용
            </button>
            {location?.lat !== 0 && (
              <p className="text-xs text-green-600">✓ 위치 설정 완료: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">반경 (km)</label>
              <input type="range" min="10" max="200" step="10" {...register('radiusKm', { valueAsNumber: true })} className="w-full" />
              <p className="text-xs text-right text-gray-500">{watch('radiusKm')}km</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-300 rounded-md py-2 text-sm">이전</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg">다음</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Step 3 — 알림 설정</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">알림 채널</label>
              <select {...register('notifyChannel')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="push">웹 푸시 알림</option>
                <option value="kakao">카카오 알림톡</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-300 rounded-md py-2 text-sm">이전</button>
              <button type="submit" disabled={mutation.isPending} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg disabled:opacity-50">
                {mutation.isPending ? '등록 중...' : '수요 등록'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
