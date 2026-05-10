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
  onAddToWishlist,
  colors,
  sizes,
  currentPrice,
  basePrice,
  hasDiscount,
  discountPercent,
  stockMessage
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-lumiere-gray font-medium">LUMIÈRE Studio</span>
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
              className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                selectedColor === color ? 'border-transparent' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: color }} // Assumes color is a hex or standard color name
              title={color}
            >
              {selectedColor === color && (
                <span className="absolute -inset-1.5 rounded-full border border-lumiere-charcoal" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[0.18em] uppercase mb-3 flex justify-between items-center">
          <span>Kích cỡ</span>
          <button className="text-lumiere-terracotta font-normal normal-case tracking-normal">Bảng size →</button>
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

      <button 
        onClick={onAddToWishlist}
        className="w-full border border-lumiere-charcoal/30 text-[11px] tracking-[0.2em] uppercase font-medium h-11 hover:bg-lumiere-charcoal hover:text-white transition-all mb-6"
      >
        ♡ Lưu vào yêu thích
      </button>

      {/* Service Info */}
      <div className="p-4 border border-lumiere-gray/20 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 text-[13px] text-lumiere-gray">
          <span>🚚</span> Giao hàng miễn phí cho đơn từ 500.000 ₫
        </div>
        <div className="flex items-center gap-3 text-[13px] text-lumiere-gray">
          <span>↩️</span> Đổi trả miễn phí trong 30 ngày
        </div>
        <div className="flex items-center gap-3 text-[13px] text-lumiere-gray">
          <span>✅</span> Hàng chính hãng có tem bảo đảm
        </div>
      </div>
    </div>
  );
}
