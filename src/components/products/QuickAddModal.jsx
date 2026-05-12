import React, { useMemo, useState, useEffect } from 'react';
import { getImageUrl, formatPrice } from '../../utils/format';
import { saveCartSnapshotCount, emitCartUpdated } from '../../utils/cart';

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

const API_CART_URL = '/api/v1/cart';

export default function QuickAddModal({ product: initialProduct, onClose }) {
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/v1/products/${initialProduct.id}`);
        if (res.ok) {
          const payload = await res.json();
          const data = payload?.data ?? payload;
          setProduct(data);
          setActiveImage(data.thumbnailUrl);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setDetailLoading(false);
      }
    };

    if (initialProduct?.id) fetchDetail();
  }, [initialProduct]);

  const variants = useMemo(() => product?.variants || [], [product]);
  
  const colors = useMemo(() => {
    const rawColors = variants.map(v => typeof v.color === 'object' ? v.color.name : v.color).filter(Boolean);
    return [...new Set(rawColors)];
  }, [variants]);
  
  const sizes = useMemo(() => {
    const rawSizes = variants.map(v => typeof v.size === 'object' ? (v.size.name || v.size.code) : v.size).filter(Boolean);
    const uniqueSizes = [...new Set(rawSizes)];
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "FREESIZE", "KHÁC"];
    
    return uniqueSizes.sort((a, b) => {
      const idxA = sizeOrder.indexOf(a.toString().toUpperCase());
      const idxB = sizeOrder.indexOf(b.toString().toUpperCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.toString().localeCompare(b.toString());
    });
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return variants.find(v => {
      const vColor = typeof v.color === 'object' ? v.color.name : v.color;
      const vSize = typeof v.size === 'object' ? (v.size.name || v.size.code) : v.size;
      return vColor === selectedColor && vSize === selectedSize;
    }) || null;
  }, [selectedColor, selectedSize, variants]);

  const currentPrice = selectedVariant?.salePrice || product?.salePrice || product?.price || product?.basePrice || 0;
  const basePrice = product?.basePrice || currentPrice;
  const hasDiscount = currentPrice < basePrice;

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert('Vui lòng chọn đầy đủ màu sắc và kích cỡ.');
      return;
    }
    const token = window.localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để thực hiện tính năng này.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CART_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variantId: String(selectedVariant.id), quantity }),
      });

      if (response.ok) {
        const payload = await response.json();
        const cartData = payload?.data ?? payload;
        const totalQty = Array.isArray(cartData?.items) 
          ? cartData.items.reduce((sum, i) => sum + i.quantity, 0)
          : quantity;
        saveCartSnapshotCount(totalQty);
        emitCartUpdated({ count: totalQty });
        onClose();
      } else {
        alert('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  if (!initialProduct) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl shadow-2xl animate-fade-up overflow-hidden relative max-h-[90vh] min-h-[400px] flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !product ? (
          <div className="flex-1 flex items-center justify-center py-20 text-lumiere-gray">
            Không thể tải thông tin sản phẩm.
          </div>
        ) : (
          <>
            {/* Left: Images */}
            <div className="w-full md:w-1/2 bg-lumiere-blush flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden relative">
                <img 
                  src={getImageUrl(activeImage)} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {(() => {
                const images = [product.thumbnailUrl, ...(product.imageUrls || [])];
                if (images.length <= 1) return null;
                return (
                  <div className="flex gap-2 p-4 bg-white/50 backdrop-blur-sm overflow-x-auto custom-scrollbar">
                    {images.map((img, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveImage(img)}
                        className={`w-16 h-20 flex-shrink-0 border transition-all ${activeImage === img ? 'border-lumiere-charcoal opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={getImageUrl(img)} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-lumiere-gray mb-3">
                  <span>CLOTHING STORE Studio</span>
                  <span>•</span>
                  <div className="flex items-center text-lumiere-gold">
                    <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                    <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                    <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                    <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                    <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                  </div>
                </div>
                <h2 className="serif text-3xl text-lumiere-charcoal mb-4 leading-tight">{product.name || product.ten}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-lumiere-terracotta font-medium">{formatPrice(currentPrice)}</span>
                  {hasDiscount && (
                    <span className="text-lumiere-gray line-through">{formatPrice(basePrice)}</span>
                  )}
                </div>
              </div>

              <div className="space-y-8 flex-1">
                {/* Colors */}
                {colors.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                      Màu sắc — {selectedColor || 'Chọn màu'}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {colors.map(color => (
                        <button 
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center ${selectedColor === color ? 'border-lumiere-charcoal ring-2 ring-offset-2 ring-lumiere-charcoal/30' : 'border-lumiere-gray/20 hover:border-lumiere-charcoal'}`}
                          style={{ background: COLOR_MAP[color] || '#EEE' }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <span className={`material-symbols-outlined text-[18px] ${color === 'Màu đen' || color === 'Xanh navy' ? 'text-white' : 'text-stone-900'}`}>check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                      Kích cỡ
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(size => (
                        <button 
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[50px] h-10 px-4 flex items-center justify-center border text-[11px] font-bold tracking-widest transition-all ${selectedSize === size ? 'bg-lumiere-charcoal text-white border-lumiere-charcoal' : 'border-lumiere-gray/30 text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Message */}
                <div className="text-[11px] italic text-lumiere-gray">
                  {!selectedColor || !selectedSize ? 'Chọn size và màu sắc để xem tồn kho.' : (selectedVariant ? `Còn ${selectedVariant.stockQty} sản phẩm.` : 'Cặp màu/size này hiện không có sẵn.')}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-lumiere-gray/10 flex gap-4">
                <div className="flex items-center border border-lumiere-gray/30">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-12 flex items-center justify-center hover:bg-lumiere-cream transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-12 flex items-center justify-center hover:bg-lumiere-cream transition-colors"
                  >
                    +
                  </button>
                </div>
                <button 
                  disabled={loading || !selectedVariant || (selectedVariant && selectedVariant.stockQty <= 0)}
                  onClick={handleAddToCart}
                  className="flex-1 bg-lumiere-terracotta text-white text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-lumiere-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
