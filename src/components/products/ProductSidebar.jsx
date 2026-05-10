import React, { useState } from 'react';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-lumiere-gray/20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4.5 text-[12px] tracking-[0.18em] uppercase font-medium text-lumiere-charcoal"
      >
        <span>{title}</span>
        <span className="text-lg text-lumiere-gray font-light">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-5' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default function ProductSidebar({ 
  categories, 
  selectedCategoryId, 
  onCategoryChange,
  priceRange,
  onPriceChange,
  priceRanges
}) {
  return (
    <aside className="hidden lg:block space-y-2">
      <div className="text-[10px] tracking-[0.25em] uppercase text-lumiere-charcoal mb-6 font-medium">
        Bộ lọc
      </div>

      <AccordionItem title="Danh mục" defaultOpen={true}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="category"
              checked={!selectedCategoryId}
              onChange={() => onCategoryChange('')}
              className="accent-lumiere-terracotta w-3.5 h-3.5"
            />
            <span className={`text-[13px] transition-colors ${!selectedCategoryId ? 'text-lumiere-charcoal font-medium' : 'text-lumiere-gray group-hover:text-lumiere-charcoal'}`}>
              Tất cả sản phẩm
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="category"
                checked={selectedCategoryId === String(cat.id)}
                onChange={() => onCategoryChange(String(cat.id))}
                className="accent-lumiere-terracotta w-3.5 h-3.5"
              />
              <span className={`text-[13px] transition-colors ${selectedCategoryId === String(cat.id) ? 'text-lumiere-charcoal font-medium' : 'text-lumiere-gray group-hover:text-lumiere-charcoal'}`}>
                {cat.name || cat.ten}
              </span>
            </label>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem title="Khoảng giá">
        <div className="space-y-4 pt-2">
          {Object.entries(priceRanges).map(([key, item]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="price"
                checked={priceRange === key}
                onChange={() => onPriceChange(key)}
                className="accent-lumiere-terracotta w-3.5 h-3.5"
              />
              <span className={`text-[13px] transition-colors ${priceRange === key ? 'text-lumiere-charcoal font-medium' : 'text-lumiere-gray group-hover:text-lumiere-charcoal'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem title="Kích cỡ">
        <div className="flex flex-wrap gap-2 pt-2">
          {['XS', 'S', 'M', 'L', 'XL'].map(size => (
            <button 
              key={size}
              className="text-[11px] tracking-[0.15em] uppercase font-medium px-4 py-2 border border-lumiere-gray/30 text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all"
            >
              {size}
            </button>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem title="Màu sắc">
        <div className="flex flex-wrap gap-3 pt-2">
          {[
            { name: 'Kem', bg: '#F5EFE0' },
            { name: 'Đen', bg: '#1A1A1A' },
            { name: 'Camel', bg: '#C4A882' },
            { name: 'Đất nung', bg: '#C4714A' },
            { name: 'Xanh khói', bg: '#8BAAB2' }
          ].map(color => (
            <button 
              key={color.name}
              title={color.name}
              className="w-7 h-7 rounded-full border border-lumiere-gray/20 hover:border-lumiere-charcoal transition-all"
              style={{ backgroundColor: color.bg }}
            />
          ))}
        </div>
      </AccordionItem>

      <button 
        onClick={() => {
          onCategoryChange('');
          onPriceChange('all');
        }}
        className="w-full mt-6 py-3 border border-lumiere-gray/30 text-[11px] tracking-[0.15em] uppercase text-lumiere-gray hover:text-lumiere-charcoal hover:border-lumiere-charcoal transition-all font-medium"
      >
        Xóa bộ lọc
      </button>
    </aside>
  );
}
