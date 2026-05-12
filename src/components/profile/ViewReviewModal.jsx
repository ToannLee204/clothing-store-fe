import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/format';

function resolveProductId(item, review) {
  const candidate = review?.productId
    ?? item?.productId
    ?? item?.product?.id
    ?? item?.product?.productId
    ?? item?.variant?.productId
    ?? item?.orderDetail?.productId;

  return candidate != null ? String(candidate) : '';
}

export default function ViewReviewModal({ show, onClose, item }) {
  if (!show || !item || !item.review) return null;

  const { review } = item;
  const productId = resolveProductId(item, review);
  const productTitle = item.productName || `San pham #${review.productId ?? review.orderItemId}`;
  const variantLabel = `${item.color || '--'} / ${item.size || '--'}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-lumiere-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg p-8 lg:p-10 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-lumiere-gray/10">
          <h3 className="serif text-2xl text-lumiere-charcoal">Danh gia cua ban</h3>
          <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="w-16 h-20 bg-lumiere-blush overflow-hidden shrink-0">
            {item.thumbnailUrl ? (
              <img src={getImageUrl(item.thumbnailUrl)} alt={productTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-lumiere-gray">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="truncate">
              <Link
                to={`/product/${productId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-lumiere-charcoal hover:text-lumiere-terracotta transition-colors"
              >
                {productTitle}
              </Link>
            </h4>
            <p className="text-[12px] text-lumiere-gray mt-1">Phan loai: {variantLabel}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`material-symbols-outlined text-2xl ${star <= review.starRating ? 'text-lumiere-terracotta fill-1' : 'text-lumiere-gray/20'}`}
                  style={{ fontVariationSettings: star <= review.starRating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              ))}
            </div>
            <p className="text-[14px] text-lumiere-charcoal leading-relaxed whitespace-pre-line italic border-l-2 border-lumiere-terracotta/30 pl-4 py-1">
              "{review.content || 'Khong co noi dung.'}"
            </p>
          </div>

          {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.imageUrls.map((url, idx) => (
                <div key={idx} className="w-20 h-20 border border-lumiere-gray/10 overflow-hidden">
                  <img src={getImageUrl(url)} alt="Review" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 text-[12px] text-lumiere-gray">
            Ngay danh gia: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}
