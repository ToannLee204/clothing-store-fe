import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/format';

const PLACEHOLDER_IMAGE = 'https://placehold.co/160x220?text=No+Image';
const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export default function CartItem({ item, onUpdateQuantity, onRemove, isBusy }) {
  return (
    <div className="py-8 flex flex-col md:flex-row gap-6 border-b border-lumiere-gray/10 group">
      {/* Product Image */}
      <Link 
        to={`/product/${item.productId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full md:w-[120px] aspect-[3/4] bg-lumiere-blush overflow-hidden shrink-0"
      >
        <img 
          src={getImageUrl(item.thumbnailUrl || item.imageUrl)} 
          alt={item.productName} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to={`/product/${item.productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="serif text-[20px] text-lumiere-charcoal hover:text-lumiere-terracotta transition-colors leading-tight"
            >
              {item.productName}
            </Link>
            <p className="text-[12px] tracking-wider text-lumiere-gray uppercase mt-2">
              {item.color || '—'} / {item.size || '—'}
            </p>
            <p className="text-[11px] text-lumiere-gray/60 mt-1 uppercase tracking-widest">SKU: {item.sku || 'N/A'}</p>
          </div>
          <button 
            onClick={() => onRemove(item)}
            disabled={isBusy}
            className="text-lumiere-gray hover:text-lumiere-terracotta transition-colors"
            title="Xóa sản phẩm"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-6">
          {/* Quantity Selector */}
          <div className="flex border border-lumiere-gray/20 w-max">
            <button 
              onClick={() => onUpdateQuantity(item, item.quantity - 1)}
              disabled={isBusy || item.quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-lumiere-charcoal"
            >
              −
            </button>
            <div className="w-12 h-10 flex items-center justify-center text-[14px] font-medium border-x border-lumiere-gray/20">
              {item.quantity}
            </div>
            <button 
              onClick={() => onUpdateQuantity(item, item.quantity + 1)}
              disabled={isBusy}
              className="w-10 h-10 flex items-center justify-center text-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white transition-all disabled:opacity-30"
            >
              +
            </button>
          </div>

          {/* Pricing */}
          <div className="text-right">
            <p className="text-[12px] text-lumiere-gray mb-1">Đơn giá: {formatVND(item.unitPrice)}</p>
            <p className="text-[18px] font-semibold text-lumiere-charcoal">{formatVND(item.lineTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
