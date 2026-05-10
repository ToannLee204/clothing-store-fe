import React from 'react';

export default function ViewReviewModal({ show, onClose, item }) {
  if (!show || !item || !item.review) return null;
  const { review } = item;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-lumiere-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg p-8 lg:p-10 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-lumiere-gray/10">
          <h3 className="serif text-2xl text-lumiere-charcoal">Đánh giá của bạn</h3>
          <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="w-16 h-20 bg-lumiere-blush overflow-hidden shrink-0">
            {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-lumiere-charcoal truncate">{item.productName}</h4>
            <p className="text-[12px] text-lumiere-gray mt-1">Phân loại: {item.color} / {item.size}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`material-symbols-outlined text-2xl ${star <= review.starRating ? 'text-lumiere-terracotta fill-1' : 'text-lumiere-gray/20'}`}
                      style={{ fontVariationSettings: star <= review.starRating ? "'FILL' 1" : "'FILL' 0" }}>
                  star
                </span>
              ))}
            </div>
            <p className="text-[14px] text-lumiere-charcoal leading-relaxed whitespace-pre-line italic border-l-2 border-lumiere-terracotta/30 pl-4 py-1">
              "{review.content || 'Không có nội dung.'}"
            </p>
          </div>

          {review.imageUrls && review.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.imageUrls.map((url, idx) => (
                <div key={idx} className="w-20 h-20 border border-lumiere-gray/10 overflow-hidden">
                  <img src={url} alt="Review" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 text-[12px] text-lumiere-gray">
            Ngày đánh giá: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}
