import { Link } from 'react-router-dom';
import type { SearchResultItem } from '@kosmes/shared';

interface Props {
  results: SearchResultItem[];
}

export function SearchResultList({ results }: Props) {
  return (
    <ul className="divide-y divide-gray-100">
      {results.map((r) => (
        <li key={r.listing.id} className="p-4 hover:bg-gray-50">
          <Link to={`/listings/${r.listing.id}`}>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{r.listing.title}</h3>
              <span
                className="ml-2 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: scoreColor(r.scoreTotal), color: '#fff' }}
              >
                {(r.scoreTotal * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-3 text-xs text-gray-500 mt-1">
              {r.listing.price && (
                <span className="font-medium text-gray-700">
                  {r.listing.price.toLocaleString()}원
                </span>
              )}
              <span>📍 {r.distanceKm.toFixed(1)}km</span>
              {r.listing.voltage && <span>⚡ {r.listing.voltage}V</span>}
              {r.listing.condition && <span>{conditionLabel(r.listing.condition)}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.8) return '#16a34a';
  if (score >= 0.6) return '#ea580c';
  return '#6b7280';
}

function conditionLabel(c: string) {
  return { new: '신품', used: '중고', refurbished: '재생' }[c] ?? c;
}
