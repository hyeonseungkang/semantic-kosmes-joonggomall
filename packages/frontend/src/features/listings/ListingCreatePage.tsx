import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listingsApi } from '../../shared/api/listings';
import type { CreateListingDto } from '@kosmes/shared';

export function ListingCreatePage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateListingDto>();

  const mutation = useMutation({
    mutationFn: listingsApi.create,
    onSuccess: (listing) => {
      toast.success('매물이 등록되었습니다.');
      navigate(`/listings/${listing.id}`);
    },
    onError: () => toast.error('매물 등록에 실패했습니다.'),
  });

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold mb-6">매물 등록</h1>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input {...register('title', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          {errors.title && <p className="text-xs text-red-500 mt-1">제목을 입력해주세요.</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대분류</label>
            <input {...register('categoryL1')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="예: 일반산업" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">중분류</label>
            <input {...register('categoryL2')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="예: 공기청정/환기" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
          <textarea {...register('description')} rows={6} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="장비 스펙, 상태, 사용 이력 등을 자세히 입력해주세요." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
            <input type="number" {...register('price', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전압 (V)</label>
            <input type="number" {...register('voltage', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="220" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">출력 (kW)</label>
            <input type="number" step="0.01" {...register('powerKw', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select {...register('condition')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">선택</option>
              <option value="used">중고</option>
              <option value="new">신품</option>
              <option value="refurbished">재생</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
          <input {...register('locationText')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="예: 충청북도 음성군" />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? '등록 중...' : '매물 등록'}
        </button>
      </form>
    </div>
  );
}
