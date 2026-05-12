import React from 'react';

const formatPrice = (value) => {
  const numericValue = Number(value) || 0;
  return `${new Intl.NumberFormat('vi-VN').format(numericValue)} ₫`;
};

export default function ProductInfo({ 
  product, 
  selectedColor, 
  onSelectColor, 
  selectedSize, 
  onSelectSize,
  quantity,
  onQuantityChange,
  onAddToCart,
  colors,
  sizes,
  currentPrice,
  basePrice,
  hasDiscount,
  discountPercent,
  stockMessage,
  colorMap = {}
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-lumiere-gray font-medium">CLOTHING STORE Studio</span>
        <span className="w-1 h-1 rounded-full bg-lumiere-gray" />
        <div className="flex gap-0.5 text-lumiere-gold text-sm">★★★★★</div>
        <span className="text-[12px] text-lumiere-gray">(128 đánh giá)</span>
      </div>

      <h1 className="serif text-[clamp(32px,4vw,48px)] font-light leading-[1.1] mb-3 text-lumiere-charcoal">
        {product.name}
      </h1>

      <div className="flex items-baseline gap-4 mb-7">
        <span className="text-[26px] font-medium text-lumiere-terracotta">{formatPrice(currentPrice)}</span>
        {hasDiscount && (
          <>
            <span className="text-[16px] text-lumiere-gray line-through">{formatPrice(basePrice)}</span>
            <span className="text-[12px] bg-[#FFF0E8] text-lumiere-terracotta px-2.5 py-0.5 tracking-wider font-medium">−{discountPercent}%</span>
          </>
        )}
      </div>

      {/* Colors */}
      <div className="mb-6">
        <div className="text-[11px] tracking-[0.18em] uppercase mb-3 flex gap-2">
          Màu sắc <span className="text-lumiere-gray font-normal">— {selectedColor || 'Chọn màu'}</span>
        </div>
        <div className="flex gap-3">
          {colors.map(color => (
            <button 
              key={color}
              onClick={() => onSelectColor(color)}
              className={`w-8 h-8 rounded-full border transition-all relative ${
                selectedColor === color ? 'border-lumiere-charcoal ring-2 ring-lumiere-charcoal ring-offset-2' : 'border-stone-200 hover:scale-110'
              }`}
              style={{ background: colorMap[color] || '#A8A29E' }}
              title={color}
            >
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[0.18em] uppercase mb-3 flex justify-between items-center">
          <span>Kích cỡ</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button 
              key={size}
              onClick={() => onSelectSize(size)}
              className={`w-[52px] h-[52px] flex items-center justify-center border text-[13px] font-medium transition-all ${
                selectedSize === size 
                  ? 'bg-lumiere-charcoal text-lumiere-cream border-lumiere-charcoal' 
                  : 'border-lumiere-gray/35 text-lumiere-charcoal hover:border-lumiere-charcoal'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {stockMessage && (
          <p className="text-[12px] text-lumiere-gray mt-2.5">{stockMessage}</p>
        )}
      </div>

      {/* Action Area */}
      <div className="flex gap-3 mb-4">
        <div className="flex border border-lumiere-gray/35">
          <button 
            onClick={() => onQuantityChange(-1)}
            className="w-11 h-11 flex items-center justify-center text-xl hover:bg-lumiere-charcoal hover:text-lumiere-cream transition-all"
          >
            −
          </button>
          <div className="w-14 h-11 flex items-center justify-center text-[15px] font-medium border-x border-lumiere-gray/35">
            {quantity}
          </div>
          <button 
            onClick={() => onQuantityChange(1)}
            className="w-11 h-11 flex items-center justify-center text-xl hover:bg-lumiere-charcoal hover:text-lumiere-cream transition-all"
          >
            +
          </button>
        </div>
        <button 
          onClick={onAddToCart}
          className="flex-1 bg-lumiere-terracotta text-white text-[11px] tracking-[0.2em] uppercase font-medium h-11 px-5 hover:bg-transparent hover:text-lumiere-terracotta border border-lumiere-terracotta transition-all"
        >
          Thêm vào giỏ hàng
        </button>
      </div>

      {/* Service Info */}
      <div className="p-5 bg-stone-50 border border-stone-100 flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-4 text-[13px] text-lumiere-charcoal/80">
          <span className="material-symbols-outlined text-lumiere-terracotta text-[20px]">local_shipping</span>
          <span className="font-medium">Giao hàng miễn phí cho đơn từ 500.000 ₫</span>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-lumiere-charcoal/80">
          <span className="material-symbols-outlined text-lumiere-terracotta text-[20px]">assignment_return</span>
          <span className="font-medium">Đổi trả miễn phí trong 30 ngày</span>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-lumiere-charcoal/80">
          <span className="material-symbols-outlined text-lumiere-terracotta text-[20px]">verified</span>
          <span className="font-medium">Hàng chính hãng có tem bảo đảm</span>
        </div>
      </div>
    </div>
  );
}
