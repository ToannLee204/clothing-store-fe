import React, { useState } from 'react';

export default function ProductTabs({ reviews, description }) {
  const [activeTab, setActiveTab] = useState('reviews');

  const tabs = [
    { id: 'reviews', label: `Đánh giá (${reviews.length})` },
    { id: 'qa', label: 'Hỏi đáp (14)' },
    { id: 'styling', label: 'Gợi ý phối đồ' }
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
                      <div className="font-medium text-[14px] text-lumiere-charcoal">{r.userName || r.userFullName || 'Khách hàng'}</div>
                      <div className="text-[11px] text-lumiere-gray mt-0.5">
                        {new Date(r.createdAt || r.ngayTao).toLocaleDateString('vi-VN')} · Size {r.variantSize || 'S'} · Màu {r.variantColor || 'Ivory'}
                      </div>
                    </div>
                    <div className="text-lumiere-gold text-[13px]">
                      {'★'.repeat(r.starRating || 5)}{'☆'.repeat(5 - (r.starRating || 5))}
                    </div>
                  </div>
                  <p className="text-[14px] text-lumiere-gray leading-relaxed">
                    "{r.comment || r.noiDung || 'Không có nhận xét.'}"
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-lumiere-gray serif italic">Chưa có đánh giá nào cho sản phẩm này.</div>
            )}
          </div>
        )}
        
        {activeTab === 'qa' && (
          <div className="text-center py-10 text-lumiere-gray serif italic">Phần hỏi đáp đang được cập nhật...</div>
        )}

        {activeTab === 'styling' && (
          <div className="text-center py-10 text-lumiere-gray serif italic">Gợi ý phối đồ đang được chuẩn bị...</div>
        )}
      </div>
    </div>
  );
}
