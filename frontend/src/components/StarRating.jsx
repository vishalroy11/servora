import { Star } from 'lucide-react';

export function StarRating({ rating = 0, count, showCount = true, size = 'sm', interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  const sizeClass = starSizes[size] || starSizes.sm;

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => {
          const isFilled = rating >= star;
          const isHalf = !isFilled && rating >= star - 0.5;

          return (
            <button
              type="button"
              key={star}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(star)}
              className={`p-0.5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-125 focus:outline-none' : 'cursor-default'
              }`}
            >
              <Star
                className={`${sizeClass} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {rating > 0 && (
        <span className="text-xs font-semibold text-slate-700 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && (
        <span className="text-xs text-slate-500">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
