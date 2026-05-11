import React, { useState } from 'react';
import { getImageUrl } from '../../utils/format';

export default function ProductTabs({ reviews, totalReviews, description, onToggleLike }) {
  const [activeTab, setActiveTab] = useState('reviews');

  const tabs = [
    { id: 'reviews', label: `Đánh giá (${totalReviews || reviews.length})` }
  ];

  return (
    <div className="mt-16 border-t border-lumiere-gray/20 pt-10">
      <div className="flex border-b border-lumiere-gray/20 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[11px] tracking-[0.2em] uppercase font-medium pb-3 mr-9 transition-all border-b-2 ${
              activeTab === tab.id ? 'text-lumiere-charcoal border-lumiere-charcoal' : 'text-lumiere-gray border-transparent hover:text-lumiere-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.length > 0 ? (
              reviews.map((r, idx) => (
                <div key={idx} className="p-6 border border-lumiere-gray/15">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-[14px] text-lumiere-charcoal">{r.userFullName || r.userName || 'Khách hàng'}</div>
                      <div className="text-[11px] text-lumiere-gray mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className="text-lumiere-gold text-[13px]">
                      {'★'.repeat(r.starRating || 5)}{'☆'.repeat(5 - (r.starRating || 5))}
                    </div>
                  </div>
                  <p className="text-[14px] text-lumiere-gray leading-relaxed mb-4">
                    "{r.content || r.comment || 'Không có nhận xét.'}"
                  </p>

                  {r.imageUrls && r.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {r.imageUrls.map((url, i) => (
                        <img 
                          key={i} 
                          src={getImageUrl(url)} 
                          alt={`Review img ${i}`} 
                          className="w-16 h-16 object-cover border border-lumiere-gray/10 rounded-sm" 
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[12px] text-lumiere-gray">
                    <button 
                      onClick={() => onToggleLike && onToggleLike(r.reviewId)}
                      className={`flex items-center gap-1 transition-colors ${r.likedByMe ? 'text-lumiere-terracotta' : 'hover:text-lumiere-charcoal'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={r.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                      <span>{r.likeCount || 0}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-lumiere-gray serif italic">Chưa có đánh giá nào cho sản phẩm này.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
