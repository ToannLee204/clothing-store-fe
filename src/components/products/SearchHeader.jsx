import React from 'react';

export default function SearchHeader({ keyword, onSearchChange, totalCount }) {
  return (
    <div className="pt-28 pb-8 border-b border-lumiere-gray/20">
      <div className="relative">
        <input 
          type="text" 
          value={keyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..." 
          className="w-full bg-transparent border-none border-b-2 border-lumiere-charcoal focus:border-lumiere-terracotta text-[clamp(28px,5vw,52px)] font-light serif text-lumiere-charcoal py-4 outline-none placeholder:text-lumiere-gray/30 transition-colors"
          autoFocus
        />
        <svg 
          className="absolute right-0 top-1/2 -translate-y-1/2 text-lumiere-gray" 
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      
      <div className="mt-4 text-[13px] text-lumiere-gray">
        {keyword ? (
          <>Tìm kiếm "<span className="font-medium text-lumiere-charcoal">{keyword}</span>" — {totalCount} kết quả</>
        ) : (
          <>Hiển thị {totalCount} sản phẩm</>
        )}
      </div>
    </div>
  );
}
