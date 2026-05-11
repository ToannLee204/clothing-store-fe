import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  emitCartUpdated,
  saveCartSnapshotCount,
} from '../utils/cart';
import { getImageUrl } from '../utils/format';
import ProductGallery from '../components/products/ProductGallery';
import ProductInfo from '../components/products/ProductInfo';
import ProductDetailAccordions from '../components/products/ProductDetailAccordions';
import ProductTabs from '../components/products/ProductTabs';
import ProductCard from '../components/common/ProductCard';

const API_PRODUCTS_URL = '/api/v1/products';
const API_CART_URL = '/api/v1/cart';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function normalizePagination(payload) {
  const base = payload && typeof payload === 'object' && ('meta' in payload || 'result' in payload || 'content' in payload)
      ? payload : payload?.data ?? payload;
  const meta = base?.meta ?? base?.data?.meta ?? null;
  const result = normalizeList(base);
  return { meta, result };
}

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_PRODUCTS_URL}/${id}`);
        if (!response.ok) throw new Error('Không thể tải chi tiết sản phẩm');
        
        const payload = await response.json();
        const data = payload?.data ?? payload;
        
        if (!data || Number(data?.status) === 0) {
          throw new Error('Sản phẩm này không tồn tại hoặc đã bị ẩn.');
        }

        setProduct(data);
        setSelectedImage(data.thumbnailUrl || '');
        
        // Fetch reviews
        fetchProductReviews(data.id);
        
        // Fetch related products (e.g., from same category)
        if (data.categoryId) {
          fetchRelatedProducts(data.categoryId);
        }
      } catch (err) {
        setError(err?.message || 'Lỗi tải chi tiết sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetail();
  }, [id]);

  const fetchProductReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const token = window.localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_PRODUCTS_URL}/${productId}/reviews?page=0&pageSize=10`, {
        headers
      });
      if (res.ok) {
        const payload = await res.json();
        const { result, meta } = normalizePagination(payload);
        setReviews(result);
        setTotalReviews(meta?.totals ?? result.length);
      }
    } catch (e) { 
      console.error('Lỗi tải đánh giá:', e); 
    } finally { 
      setReviewsLoading(false); 
    }
  };

  const handleToggleLike = async (reviewId) => {
    const token = window.localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để thực hiện tính năng này.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setReviews(prev => prev.map(r => {
          if (r.reviewId === reviewId) {
            const isNowLiked = !r.likedByMe;
            return {
              ...r,
              likedByMe: isNowLiked,
              likeCount: isNowLiked ? (r.likeCount + 1) : Math.max(0, r.likeCount - 1)
            };
          }
          return r;
        }));
      }
    } catch (e) {
      console.error('Lỗi khi like:', e);
    }
  };

  const fetchRelatedProducts = async (categoryId) => {
    try {
      const res = await fetch(`${API_PRODUCTS_URL}?categoryId=${categoryId}&pageSize=5`);
      if (res.ok) {
        const payload = await res.json();
        const list = normalizeList(payload);
      }
    } catch (e) { console.error('Lỗi tải sản phẩm liên quan:', e); }
  };

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
      const isANum = !isNaN(a);
      const isBNum = !isNaN(b);
      
      if (isANum && isBNum) return Number(a) - Number(b);
      if (isANum) return 1; 
      if (isBNum) return -1;
      
      const idxA = sizeOrder.indexOf(a.toString().toUpperCase());
      const idxB = sizeOrder.indexOf(b.toString().toUpperCase());
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
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

  const currentPrice = selectedVariant?.salePrice || product?.basePrice || 0;
  const basePrice = product?.basePrice || 0;
  const hasDiscount = currentPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0;

  const stockMessage = useMemo(() => {
    if (!selectedColor || !selectedSize) return 'Chọn size và màu sắc để xem tồn kho.';
    if (!selectedVariant) return 'Cặp màu/size này hiện không có sẵn.';
    if (selectedVariant.stockQty <= 0) return 'Hiện đã hết hàng cho lựa chọn này.';
    return `Còn ${selectedVariant.stockQty} sản phẩm trong kho.`;
  }, [selectedColor, selectedSize, selectedVariant]);

  const handleAddToCart = async () => {
    // Debug để kiểm tra
    console.log('Selected Color:', selectedColor);
    console.log('Selected Size:', selectedSize);
    console.log('Selected Variant:', selectedVariant);

    if (!selectedVariant) {
      alert('Vui lòng chọn đầy đủ màu sắc và kích cỡ.');
      return;
    }
    const token = window.localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để thực hiện tính năng này.');
      return;
    }

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
        alert('Đã thêm vào giỏ hàng!');
      } else {
        alert('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-lumiere-cream">
       <div className="w-12 h-12 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lumiere-cream p-6 text-center">
      <h2 className="serif text-3xl text-lumiere-charcoal mb-4">Rất tiếc!</h2>
      <p className="text-lumiere-gray mb-8">{error || 'Sản phẩm không khả dụng.'}</p>
      <button onClick={() => navigate('/products')} className="btn-dark">Quay lại mua sắm</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-lumiere-cream pb-20 pt-28">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {/* Breadcrumb */}
        <div className="text-[12px] tracking-wider text-lumiere-gray mb-10 flex gap-2 items-center">
          <span className="cursor-pointer hover:text-lumiere-charcoal" onClick={() => navigate('/')}>Trang chủ</span>
          <span>›</span>
          <span className="cursor-pointer hover:text-lumiere-charcoal" onClick={() => navigate('/products')}>Sản phẩm</span>
          <span>›</span>
          <span className="text-lumiere-charcoal">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

          {/* Left: Gallery (Sticky) */}
          <div className="lg:sticky lg:top-32">
            <ProductGallery 
              images={[getImageUrl(product.thumbnailUrl), ...(product.imageUrls || []).map(img => getImageUrl(img))]} 
              selectedImage={getImageUrl(selectedImage)}
              onSelectImage={(img) => setSelectedImage(img)}
              badge={hasDiscount ? `−${discountPercent}%` : 'Mới về'}
            />
          </div>

          {/* Right: Product Info */}
          <div>
            <ProductInfo 
              product={product}
              colors={colors}
              sizes={sizes}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              quantity={quantity}
              onQuantityChange={(delta) => setQuantity(Math.max(1, quantity + delta))}
              onAddToCart={handleAddToCart}
              currentPrice={currentPrice}
              basePrice={basePrice}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              stockMessage={stockMessage}
              colorMap={COLOR_MAP}
            />
            
            <ProductDetailAccordions product={product} />
          </div>
        </div>

        {/* Tabs: Reviews, etc. */}
        <ProductTabs 
          reviews={reviews} 
          totalReviews={totalReviews} 
          description={product.description} 
          onToggleLike={handleToggleLike}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-5 text-[11px] tracking-[0.2em] uppercase text-lumiere-gray mb-10 before:flex-1 before:h-px before:bg-lumiere-gray/20 after:flex-1 after:h-px after:bg-lumiere-gray/20">
              Có thể bạn cũng thích
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
