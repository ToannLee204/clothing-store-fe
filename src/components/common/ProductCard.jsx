import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, getImageUrl } from '../../utils/format';

export default function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <div 
      className="product-card group cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden bg-lumiere-blush aspect-[3/4] mb-4">
        <img 
          src={getImageUrl(product.thumbnailUrl || product.imageUrl || product.anhDaiDien)} 
          alt={product.productName || product.ten} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Badge */}
        {product.isNew && (
          <div className="absolute top-3.5 left-3.5 text-[10px] tracking-[0.15em] uppercase font-medium bg-lumiere-terracotta text-white px-2.5 py-1">
            New
          </div>
        )}
        
        {product.discount > 0 && (
          <div className="absolute top-3.5 left-3.5 text-[10px] tracking-[0.15em] uppercase font-medium bg-lumiere-charcoal text-white px-2.5 py-1">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist Placeholder */}
        <div className="absolute top-3.5 right-3.5 w-9 h-9 bg-lumiere-cream/90 flex items-center justify-center text-lg transition-colors hover:bg-lumiere-cream">
          ♡
        </div>

        {/* Quick Add */}
        <button 
          onClick={handleQuickAdd}
          className="absolute bottom-0 left-0 right-0 bg-lumiere-charcoal text-lumiere-cream text-center text-[11px] tracking-[0.2em] uppercase py-3.5 font-medium translate-y-full transition-transform duration-300 group-hover:translate-y-0"
        >
          + Thêm vào giỏ
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-normal serif transition-colors group-hover:text-lumiere-terracotta">
          {product.productName || product.ten}
        </h3>
        <p className="text-[11px] tracking-[0.1em] text-lumiere-gray uppercase">
          {product.categoryName || 'Sản phẩm'}
        </p>
        <div className="text-sm">
          {product.basePrice > (product.salePrice || product.price || product.giaHienTai) ? (
            <div className="flex items-center gap-2">
              <span className="text-lumiere-terracotta font-medium">{formatPrice(product.salePrice || product.price || product.giaHienTai || product.basePrice || 0)}</span>
              <span className="text-lumiere-gray line-through text-xs">{formatPrice(product.basePrice)}</span>
            </div>
          ) : (
            <span className="text-lumiere-gray">{formatPrice(product.salePrice || product.price || product.giaHienTai || product.basePrice || 0)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
