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
  colors,
  selectedColors,
  onColorChange,
  sizes,
  selectedSizes,
  onSizeChange,
  priceRange,
  onPriceChange,
  priceRanges,
  inStock,
  onInStockChange,
  onReset
}) {
  const COLOR_MAP = {
    "Màu đen": "#000000",
    "Màu trắng": "#FFFFFF",
    "Màu đỏ": "#DC2626",
    "Xanh dương": "#2563EB",
    "Xanh lá": "#16A34A",
    "Màu vàng": "#CA8A04",
    "Màu hồng": "#DB2777",
    "Màu tím": "#7C3AED",
    "Màu xám": "#4B5563",
    "Màu nâu": "#78350F",
    "Màu cam": "#EA580C",
    "Màu be": "#F5F5DC",
    "Xanh navy": "#1E3A8A",
    "Nhiều màu": "linear-gradient(45deg, red, blue, green)",
    "Màu khác": "#A8A29E"
  };
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
                {cat.displayName}
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
          {sizes.map(sizeObj => {
            const sizeValue = typeof sizeObj === 'object' ? (sizeObj.name || sizeObj.code) : sizeObj;
            const isSelected = selectedSizes.includes(sizeValue);
            return (
              <button 
                key={sizeValue}
                onClick={() => onSizeChange(sizeValue)}
                className={`text-[11px] tracking-[0.15em] uppercase font-medium px-4 py-2 border transition-all ${
                  isSelected 
                    ? 'bg-lumiere-charcoal text-lumiere-cream border-lumiere-charcoal' 
                    : 'border-lumiere-gray/30 text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal'
                }`}
              >
                {sizeValue}
              </button>
            );
          })}
        </div>
      </AccordionItem>

      <AccordionItem title="Màu sắc">
        <div className="flex flex-wrap gap-3 pt-2">
          {colors.map(colorObj => {
            const colorName = typeof colorObj === 'object' ? colorObj.name : colorObj;
            const isSelected = selectedColors.includes(colorName);
            
            return (
              <button 
                key={colorName}
                title={colorName}
                onClick={() => onColorChange(colorName)}
                className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                  isSelected 
                    ? 'border-lumiere-charcoal ring-2 ring-offset-2 ring-lumiere-charcoal/30' 
                    : 'border-lumiere-gray/20 hover:border-lumiere-charcoal'
                }`}
                style={{ background: COLOR_MAP[colorName] || '#EEE' }}
              >
                 {isSelected && (
                   <span className={`material-symbols-outlined text-[16px] ${colorName === 'Màu đen' || colorName === 'Xanh navy' ? 'text-white' : 'text-stone-900'}`}>check</span>
                 )}
              </button>
            );
          })}
        </div>
      </AccordionItem>

      <div className="pt-6 border-t border-lumiere-gray/10 mt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="accent-lumiere-charcoal w-4 h-4"
          />
          <span className={`text-[13px] tracking-wide transition-colors ${inStock ? 'text-lumiere-charcoal font-bold' : 'text-lumiere-gray group-hover:text-lumiere-charcoal'}`}>
            Chỉ hiện sản phẩm còn hàng
          </span>
        </label>
      </div>

      <button 
        onClick={onReset}
        className="w-full mt-6 py-3 border border-lumiere-gray/30 text-[11px] tracking-[0.15em] uppercase text-lumiere-gray hover:text-lumiere-charcoal hover:border-lumiere-charcoal transition-all font-medium"
      >
        Xóa tất cả lọc
      </button>
    </aside>
  );
}
