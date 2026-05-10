import React from 'react';

export default function SortBar({ sortBy, onSortChange }) {
  const chips = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Mới về', value: 'newest' },
    { label: 'Đang giảm giá', value: 'sale' },
    { label: 'Bestseller', value: 'bestseller' }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
      <div className="flex flex-wrap gap-2">
        {chips.map(chip => (
          <button 
            key={chip.value}
            className={`text-[11px] tracking-[0.15em] uppercase font-medium px-5 py-2.5 border transition-all ${
              sortBy === chip.value 
                ? 'bg-lumiere-charcoal text-lumiere-cream border-lumiere-charcoal' 
                : 'text-lumiere-gray border-lumiere-gray/30 hover:border-lumiere-charcoal hover:text-lumiere-charcoal'
            }`}
            onClick={() => onSortChange(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-auto">
        <select 
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none bg-transparent border border-lumiere-gray/30 text-[12px] tracking-[0.1em] text-lumiere-charcoal py-2.5 pl-4 pr-10 outline-none hover:border-lumiere-charcoal cursor-pointer w-full sm:w-[220px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C8178' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center'
          }}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá: Thấp → Cao</option>
          <option value="price_desc">Giá: Cao → Thấp</option>
          <option value="name">Tên A-Z</option>
        </select>
      </div>
    </div>
  );
}
