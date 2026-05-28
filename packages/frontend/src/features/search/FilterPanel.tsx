import { useSearchStore } from '../../shared/store/searchStore';

export function FilterPanel() {
  const { filters, setFilters } = useSearchStore();

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <label className="block text-xs text-gray-500 mb-1">전압</label>
        <select
          value={filters.voltage ?? ''}
          onChange={(e) => setFilters({ voltage: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5"
        >
          <option value="">전체</option>
          <option value="220">220V</option>
          <option value="380">380V</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">상태</label>
        <select
          value={filters.condition ?? ''}
          onChange={(e) => setFilters({ condition: e.target.value || undefined })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5"
        >
          <option value="">전체</option>
          <option value="used">중고</option>
          <option value="new">신품</option>
          <option value="refurbished">재생</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">최소 가격</label>
        <input
          type="number"
          placeholder="0"
          value={filters.priceMin ?? ''}
          onChange={(e) => setFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">최대 가격</label>
        <input
          type="number"
          placeholder="제한없음"
          value={filters.priceMax ?? ''}
          onChange={(e) => setFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5"
        />
      </div>
    </div>
  );
}
