/**
 * Component hiển thị hàng sao đánh giá (hỗ trợ nửa sao).
 */
export default function StarRow({ value, size = 16 }) {
  const starValue = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.round(starValue * 2) / 2;
  const stars = Array.from({ length: 5 }).map((_, idx) => {
    const starIndex = idx + 1;
    const filled = fullStars >= starIndex;
    const half = fullStars >= starIndex - 0.5 && fullStars < starIndex;
    const color = filled || half ? '#0066A2' : '#cbd5e1';

    if (half) {
      return (
        <span key={idx} className="relative inline-block" style={{ width: size, height: size }}>
          <span className="absolute inset-0">
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity="0.35">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
          <span className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        </span>
      );
    }

    return (
      <span key={idx} style={{ color }} className="inline-flex">
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
    );
  });

  return <div className="flex items-center gap-1">{stars}</div>;
}
