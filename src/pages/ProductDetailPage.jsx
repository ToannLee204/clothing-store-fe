import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  buildGuestCartItemFromVariant,
  emitCartUpdated,
  getCartCount,
  mergeGuestCartItem,
  readGuestCart,
  saveCartSnapshotCount,
  saveGuestCart,
} from '../utils/cart';

const PLACEHOLDER_IMAGE = 'https://placehold.co/900x1200?text=No+Image';
const API_PRODUCTS_URL = '/api/v1/products';
const API_CART_URL = '/api/v1/cart';
const API_REVIEWS_URL = '/api/v1/reviews';

const formatPrice = (value) => {
  const numericValue = Number(value) || 0;
  return `${new Intl.NumberFormat('vi-VN').format(numericValue)}đ`;
};

const uniqueImages = (images) => {
  const list = Array.isArray(images) ? images : [];
  return [...new Set(list.filter(Boolean))];
};

const uniqueValues = (items) => [...new Set((Array.isArray(items) ? items : []).filter(Boolean))];

const getStatusMeta = (status) => {
  if (Number(status) === 0) {
    return {
      label: 'Đã ẩn',
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    };
  }

  return {
    label: 'Đang hiển thị',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  };
};

const getStockMeta = (stockQty) => {
  const stock = Number(stockQty) || 0;

  if (stock === 0) {
    return {
      label: 'Hết hàng',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  }

  if (stock < 10) {
    return {
      label: 'Sắp hết',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    };
  }

  return {
    label: 'Sẵn hàng',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  };
};

const getVariantLabel = (variant) => {
  const parts = [variant?.color, variant?.size].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Chưa phân loại';
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
};

function StarRow({ value, size = 16 }) {
  const starValue = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.round(starValue * 2) / 2; // allow halves if any
  const stars = Array.from({ length: 5 }).map((_, idx) => {
    const starIndex = idx + 1;
    const filled = fullStars >= starIndex;
    const half = fullStars >= starIndex - 0.5 && fullStars < starIndex;
    const color = filled || half ? '#ec5b13' : '#cbd5e1';

    if (half) {
      return (
        <span key={idx} className="relative inline-block" style={{ width: size, height: size }}>
          <span className="absolute inset-0">
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity="0.35">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
          <span className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        </span>
      );
    }

    return (
      <span key={idx} style={{ color }} className="inline-flex">
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
    );
  });

  return <div className="flex items-center gap-1">{stars}</div>;
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [miniCartSummary, setMiniCartSummary] = useState(null);
  const [addAttempted, setAddAttempted] = useState(false);

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [likeBusyReviewId, setLikeBusyReviewId] = useState(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true);
      setError('');
      setCartError('');
      setMiniCartOpen(false);
      setMiniCartSummary(null);

      try {
        const response = await fetch(`${API_PRODUCTS_URL}/${id}`);

        if (!response.ok) {
          throw new Error('Không thể tải chi tiết sản phẩm');
        }

        const payload = await response.json();
        const data = payload?.data ?? payload;

        if (!data || Number(data?.status) === 0) {
          throw new Error('Sản phẩm này không tồn tại hoặc đã bị ẩn.');
        }

        setProduct(data);

        const images = uniqueImages([data?.thumbnailUrl, ...(data?.imageUrls || [])]);
        setSelectedImage(images[0] || PLACEHOLDER_IMAGE);
        setSelectedColor('');
        setSelectedSize('');
        setQuantity(1);
      } catch (err) {
        console.error('Lỗi tải chi tiết sản phẩm:', err);
        setProduct(null);
        setError(err?.message || 'Không thể tải chi tiết sản phẩm từ backend.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    } else {
      setProduct(null);
      setError('Thiếu mã sản phẩm.');
      setLoading(false);
    }
  }, [id]);

  const fetchProductReviews = async (productId) => {
    if (!productId) return;

    const token = window.localStorage.getItem('token');

    setReviewsLoading(true);
    setReviewsError('');

    try {
      const res = await fetch(`${API_PRODUCTS_URL}/${productId}/reviews?page=0&pageSize=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await parseResponseBody(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải đánh giá.'));

      const result = payload?.result ?? payload?.data?.result ?? [];
      setReviews(Array.isArray(result) ? result : []);
    } catch (e) {
      setReviewsError(e?.message || 'Không thể tải đánh giá.');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!product?.id) return;
    fetchProductReviews(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const galleryImages = useMemo(
    () => uniqueImages([product?.thumbnailUrl, ...(product?.imageUrls || [])]),
    [product]
  );

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return (
      variants.find(
        (variant) =>
          String(variant?.color ?? '') === String(selectedColor) &&
          String(variant?.size ?? '') === String(selectedSize)
      ) || null
    );
  }, [selectedColor, selectedSize, variants]);

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + (Number(variant?.stockQty) || 0), 0),
    [variants]
  );

  const availableVariantCount = useMemo(
    () => variants.filter((variant) => Number(variant?.stockQty) > 0).length,
    [variants]
  );

  const colors = useMemo(() => uniqueValues(variants.map((variant) => variant?.color)), [variants]);
  const sizes = useMemo(() => uniqueValues(variants.map((variant) => variant?.size)), [variants]);

  const getFilteredStock = (nextColor, nextSize) =>
    variants
      .filter((variant) => {
        if (nextColor && String(variant?.color ?? '') !== String(nextColor)) return false;
        if (nextSize && String(variant?.size ?? '') !== String(nextSize)) return false;
        return true;
      })
      .reduce((sum, variant) => sum + (Number(variant?.stockQty) || 0), 0);

  const colorOptions = useMemo(
    () =>
      colors.map((color) => {
        const stockQty = getFilteredStock(color, selectedSize);
        return { value: color, stockQty };
      }),
    [colors, selectedSize, variants]
  );

  const sizeOptions = useMemo(
    () =>
      sizes.map((size) => {
        const stockQty = getFilteredStock(selectedColor, size);
        return { value: size, stockQty };
      }),
    [selectedColor, sizes, variants]
  );

  const selectedVariantStock = Number(selectedVariant?.stockQty) || 0;
  const basePrice = Number(product?.basePrice || 0);
  const currentPrice = Number(selectedVariant?.salePrice ?? product?.basePrice ?? 0);
  const hasDiscount = selectedVariant?.salePrice && Number(selectedVariant.salePrice) < basePrice;
  const discountPercent =
    hasDiscount && basePrice > 0
      ? Math.round(((basePrice - Number(selectedVariant.salePrice)) / basePrice) * 100)
      : 0;

  const statusMeta = getStatusMeta(product?.status);
  const stockMeta = getStockMeta(selectedVariant?.stockQty ?? totalStock);
  const selectionError = addAttempted && (!selectedColor || !selectedSize);
  const hasSellableVariant = variants.some((variant) => (Number(variant?.stockQty) || 0) > 0);
  const addButtonDisabled = !hasSellableVariant;
  const quantityAtMax = selectedVariant ? quantity >= selectedVariantStock && selectedVariantStock > 0 : false;

  const helperMessage = useMemo(() => {
    if (cartError) return cartError;
    if (selectionError) return 'Vui lòng chọn size và màu sắc.';
    if (!selectedColor || !selectedSize) return 'Chọn size và màu sắc để xem tồn kho thực tế.';
    if (selectedVariant && selectedVariantStock === 0) return 'Biến thể bạn chọn đã hết hàng.';
    if (selectedVariant && selectedVariantStock > 0) {
      return `Còn ${selectedVariantStock} sản phẩm cho biến thể này.`;
    }
    return '';
  }, [cartError, selectionError, selectedColor, selectedSize, selectedVariant, selectedVariantStock]);

  useEffect(() => {
    if (!selectedVariant) {
      if (quantity !== 1) {
        setQuantity(1);
      }
      return;
    }

    if (selectedVariantStock > 0 && quantity > selectedVariantStock) {
      setQuantity(selectedVariantStock);
    }
  }, [quantity, selectedVariant, selectedVariantStock]);

  useEffect(() => {
    if (!miniCartOpen) return undefined;

    const timer = window.setTimeout(() => {
      setMiniCartOpen(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [miniCartOpen]);

  const handleSelectColor = (color) => {
    setAddAttempted(false);
    setCartError('');

    const nextColor = selectedColor === color ? '' : color;
    setSelectedColor(nextColor);

    if (nextColor && selectedSize && !variants.some((variant) => variant.color === nextColor && variant.size === selectedSize)) {
      setSelectedSize('');
    }
  };

  const handleSelectSize = (size) => {
    setAddAttempted(false);
    setCartError('');

    const nextSize = selectedSize === size ? '' : size;
    setSelectedSize(nextSize);

    if (nextSize && selectedColor && !variants.some((variant) => variant.color === selectedColor && variant.size === nextSize)) {
      setSelectedColor('');
    }
  };

  const handleToggleLike = async (reviewId) => {
    const token = window.localStorage.getItem('token');
    if (!token) {
      setReviewsError('Bạn cần đăng nhập để like đánh giá.');
      return;
    }

    setReviewsError('');
    setLikeBusyReviewId(reviewId);

    try {
      const res = await fetch(`${API_REVIEWS_URL}/${reviewId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await parseResponseBody(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể cập nhật like.'));

      const updated = payload?.data ?? payload;
      setReviews((prev) =>
        prev.map((r) => (r?.reviewId === reviewId ? { ...r, ...updated } : r))
      );
    } catch (e) {
      setReviewsError(e?.message || 'Không thể cập nhật like.');
    } finally {
      setLikeBusyReviewId(null);
    }
  };

  const handleAddToCart = async () => {
    setAddAttempted(true);
    setCartError('');

    if (!selectedColor || !selectedSize) {
      setCartError('Vui lòng chọn size và màu sắc.');
      return;
    }

    if (!selectedVariant) {
      setCartError('Không tìm thấy biến thể phù hợp.');
      return;
    }

    if (selectedVariantStock <= 0) {
      setCartError('Biến thể đã hết hàng.');
      return;
    }

    if (quantity > selectedVariantStock) {
      setCartError(`Số lượng tồn kho không đủ. Chỉ còn ${selectedVariantStock} sản phẩm.`);
      return;
    }

    const token = window.localStorage.getItem('token');
    const requestPayload = {
      variantId: String(selectedVariant.id),
      quantity,
    };

    try {
      if (token) {
        const response = await fetch(`${API_CART_URL}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestPayload),
        });

        const payload = await parseResponseBody(response);

        if (!response.ok) {
          throw new Error(extractMessage(payload, 'Không thể thêm sản phẩm vào giỏ hàng.'));
        }

        const cartData = payload?.data ?? payload;
        const cartCount = Array.isArray(cartData?.items)
          ? cartData.items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
          : quantity;

        saveCartSnapshotCount(cartCount);

        emitCartUpdated({
          source: 'backend-cart',
          count: cartCount,
          item: {
            productId: product.id,
            variantId: selectedVariant.id,
            quantity,
          },
          cart: cartData,
        });

        setMiniCartSummary({
          name: product.name,
          variant: getVariantLabel(selectedVariant),
          quantity,
          total: formatPrice(quantity * currentPrice),
          count: cartCount,
        });
        setMiniCartOpen(true);
        return;
      }

      const guestItem = buildGuestCartItemFromVariant({
        product,
        variant: selectedVariant,
        quantity,
        thumbnailUrl: selectedImage || product.thumbnailUrl || PLACEHOLDER_IMAGE,
      });

      const mergedCart = mergeGuestCartItem(readGuestCart(), guestItem);
      saveGuestCart(mergedCart);

      setMiniCartSummary({
        name: product.name,
        variant: getVariantLabel(selectedVariant),
        quantity,
        total: formatPrice(quantity * currentPrice),
        count: getCartCount(mergedCart),
      });
      setMiniCartOpen(true);
    } catch (err) {
      console.error('Lỗi thêm vào giỏ hàng:', err);
      setCartError(err?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="animate-pulse space-y-6">
              <div className="h-4 w-40 rounded-full bg-slate-200" />
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="aspect-[4/5] rounded-3xl bg-slate-100" />
                  <div className="grid grid-cols-4 gap-3">
                    <div className="h-20 rounded-2xl bg-slate-100" />
                    <div className="h-20 rounded-2xl bg-slate-100" />
                    <div className="h-20 rounded-2xl bg-slate-100" />
                    <div className="h-20 rounded-2xl bg-slate-100" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 rounded-full bg-slate-100" />
                  <div className="h-20 rounded-3xl bg-slate-100" />
                  <div className="h-24 rounded-3xl bg-slate-100" />
                  <div className="h-14 rounded-2xl bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-[30px]">error</span>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Không tìm thấy sản phẩm
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error || 'Sản phẩm này không tồn tại hoặc đã bị ẩn.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210]"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại danh sách sản phẩm
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ec5b13] via-[#ff8a4c] to-[#ffd0b0]" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ec5b13]/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Quay lại danh sách
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                Chi tiết sản phẩm
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {product.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                {product.description || 'Sản phẩm đang được hiển thị với giao diện chi tiết hiện đại, tối ưu khả năng đọc và xem biến thể.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Danh mục</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {product.category?.name || 'Chưa phân loại'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Trạng thái</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{statusMeta.label}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Biến thể</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{variants.length} lựa chọn</p>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Xem thêm sản phẩm
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addButtonDisabled}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d95210] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>

          {/* {(cartError || helperMessage) && (
            <div
              className={`relative mt-5 rounded-2xl border px-4 py-3 text-sm ${
                cartError || selectionError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {cartError || helperMessage}
            </div>
          )} */}

          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-medium text-slate-500">Giá hiển thị</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{formatPrice(currentPrice)}</p>
              {hasDiscount ? (
                <p className="mt-1 text-xs text-slate-400 line-through">{formatPrice(basePrice)}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-medium text-slate-500">Tồn kho tổng</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{totalStock}</p>
              <p className="mt-1 text-xs text-slate-500">{availableVariantCount} biến thể còn hàng</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-medium text-slate-500">Biến thể đang chọn</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
                {selectedVariant ? getVariantLabel(selectedVariant) : 'Chưa chọn'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedVariant ? `SKU: ${selectedVariant.sku || 'Chưa có SKU'}` : 'Chọn size và màu sắc'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-medium text-slate-500">Trạng thái kho</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`size-2 rounded-full ${stockMeta.dot}`} />
                <p className="text-xl font-black tracking-tight text-slate-900">
                  {selectedVariant ? selectedVariantStock : totalStock}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {selectedVariant ? stockMeta.label : 'Chọn biến thể để xem tồn kho chính xác'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="relative overflow-hidden bg-slate-50">
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>
                    <span className={`size-2 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
                    {selectedVariant ? getVariantLabel(selectedVariant) : 'Chưa chọn biến thể'}
                  </span>
                </div>

                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={selectedImage || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="border-t border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Hình ảnh sản phẩm</h3>
                    <p className="text-xs text-slate-400">{galleryImages.length} ảnh</p>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {galleryImages.map((image) => {
                      const isActive = selectedImage === image;

                      return (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setSelectedImage(image)}
                          className={`group overflow-hidden rounded-2xl border-2 transition ${
                            isActive
                              ? 'border-[#ec5b13] shadow-[0_10px_24px_rgba(236,91,19,0.14)]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-square bg-slate-100">
                            <img
                              src={image}
                              alt={`${product.name} thumbnail`}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ec5b13]">
                    Mô tả sản phẩm
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Thông tin chi tiết</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <span className="size-2 rounded-full bg-[#ec5b13]" />
                  Mã sản phẩm #{product.id}
                </span>
              </div>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p className="whitespace-pre-line">
                  {product.description || 'Sản phẩm chưa có mô tả chi tiết.'}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ec5b13]">Đánh giá</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Đánh giá sản phẩm</h2>
                </div>

                <div className="flex items-center gap-3">
                  {reviewsLoading ? (
                    <span className="text-xs font-bold text-slate-500">Đang tải...</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      <span className="text-slate-900 font-black">
                        {reviews.length > 0
                          ? (
                              reviews.reduce((sum, r) => sum + (Number(r?.starRating) || 0), 0) /
                              reviews.length
                            ).toFixed(1)
                          : '0.0'}
                      </span>
                      <span className="text-slate-500">/ 5</span>
                    </span>
                  )}
                </div>
              </div>

              {reviewsError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {reviewsError}
                </div>
              ) : null}

              <div className="mt-5">
                {reviewsLoading ? (
                  <div className="text-sm text-slate-500">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có đánh giá nào cho sản phẩm này.</div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const reviewId = review?.reviewId;
                      const liked = Boolean(review?.likedByMe);

                      return (
                        <div key={String(reviewId ?? Math.random())} className="rounded-2xl border border-slate-100 bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="text-sm font-black text-slate-900 truncate">
                                  {review?.userFullName || 'Khách hàng'}
                                </div>
                                <span className="text-xs text-slate-500">
                                  {review?.createdAt ? `· ${formatDateTime(review.createdAt)}` : ''}
                                </span>
                              </div>

                              <div className="mt-2">
                                <StarRow value={review?.starRating} size={14} />
                              </div>

                              {review?.content ? (
                                <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-line">
                                  {review.content}
                                </p>
                              ) : null}

                              {Array.isArray(review?.imageUrls) && review.imageUrls.length > 0 ? (
                                <div className="mt-3 grid grid-cols-5 gap-2">
                                  {review.imageUrls.slice(0, 5).map((url, idx) => (
                                    <div key={String(url ?? idx)} className="h-16 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                      <img
                                        src={url}
                                        alt={`Review image ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://placehold.co/64x64?text=IMG';
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="shrink-0 text-right">
                              <button
                                type="button"
                                disabled={likeBusyReviewId === reviewId}
                                onClick={() => handleToggleLike(reviewId)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                              >
                                <span className="text-base leading-none">
                                  {liked ? '♥' : '♡'}
                                </span>
                                <span>{review?.likeCount ?? 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Giá bán</p>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                      {formatPrice(currentPrice)}
                    </span>
                    {hasDiscount ? (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(basePrice)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {hasDiscount ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
                    -{discountPercent}%
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Tồn kho</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`size-2 rounded-full ${stockMeta.dot}`} />
                    <span className="text-lg font-black text-slate-900">
                      {selectedVariant ? selectedVariantStock : totalStock}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedVariant ? stockMeta.label : 'Chọn size và màu sắc để xem tồn kho thực tế'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Biến thể</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{variants.length}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {availableVariantCount} biến thể đang còn hàng
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">SKU</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {selectedVariant?.sku || 'Chưa có SKU'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">SKU của biến thể đang chọn</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Danh mục</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {product.category?.name || 'Chưa phân loại'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {product.category?.parentId ? 'Danh mục con' : 'Danh mục gốc'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Số lượng</p>
                    <span className="text-xs text-slate-400">Mặc định = 1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#ec5b13] hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedVariantStock || undefined}
                      value={quantity}
                      onChange={(e) => {
                        const nextValue = Math.max(1, Number(e.target.value) || 1);
                        setQuantity(selectedVariantStock > 0 ? Math.min(nextValue, selectedVariantStock) : nextValue);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedVariant || selectedVariantStock <= 0) return;
                        setQuantity((prev) => Math.min(prev + 1, selectedVariantStock));
                      }}
                      disabled={!selectedVariant || selectedVariantStock <= 0 || quantityAtMax}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#ec5b13] hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedVariant
                      ? `Có thể mua tối đa ${selectedVariantStock} sản phẩm cho biến thể này.`
                      : 'Chọn size và màu sắc để kiểm tra số lượng tối đa.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tạm tính</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{formatPrice(quantity * currentPrice)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedVariant ? getVariantLabel(selectedVariant) : 'Sẽ cập nhật khi chọn biến thể'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ec5b13]">Biến thể</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Chọn màu sắc và size</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Chọn cả 2 thuộc tính
                </span>
              </div>

              <div className="mt-5 space-y-6">
                <div className={`rounded-2xl border p-4 ${selectionError && !selectedColor ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Màu sắc</p>
                    <span className="text-xs text-slate-500">{colorOptions.length} lựa chọn</span>
                  </div>

                  {colorOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">Sản phẩm này chưa có màu sắc.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {colorOptions.map((option) => {
                        const active = selectedColor === option.value;
                        const disabled = option.stockQty <= 0;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelectColor(option.value)}
                            disabled={disabled}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              active
                                ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#c84c10] shadow-[0_10px_24px_rgba(236,91,19,0.12)]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">{option.value}</span>
                              <span className={`size-2 rounded-full ${disabled ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              {disabled ? 'Hết hàng' : `Còn ${option.stockQty} sản phẩm`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`rounded-2xl border p-4 ${selectionError && !selectedSize ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Size</p>
                    <span className="text-xs text-slate-500">{sizeOptions.length} lựa chọn</span>
                  </div>

                  {sizeOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">Sản phẩm này chưa có size.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {sizeOptions.map((option) => {
                        const active = selectedSize === option.value;
                        const disabled = option.stockQty <= 0;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelectSize(option.value)}
                            disabled={disabled}
                            className={`rounded-xl border px-3 py-3 text-center transition ${
                              active
                                ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#c84c10] shadow-[0_10px_24px_rgba(236,91,19,0.12)]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            <span className="block text-sm font-semibold">{option.value}</span>
                            <span className="mt-1 block text-[11px] text-slate-500">
                              {disabled ? 'Hết hàng' : `Còn ${option.stockQty}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Biến thể đang chọn</p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        {selectedVariant ? getVariantLabel(selectedVariant) : 'Chưa chọn'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedVariant ? `SKU: ${selectedVariant.sku || 'Chưa có SKU'}` : 'Chọn màu và size để xác nhận biến thể'}
                      </p>
                    </div>

                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${stockMeta.tone}`}>
                      <span className={`size-2 rounded-full ${stockMeta.dot}`} />
                      {selectedVariant ? stockMeta.label : 'Chưa xác định'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Quay lại danh sách
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addButtonDisabled}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    Thêm vào giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {miniCartOpen && miniCartSummary ? (
        <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] rounded-3xl border border-white/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                Thêm thành công
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900">{miniCartSummary.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{miniCartSummary.variant}</p>
            </div>

            <button
              type="button"
              onClick={() => setMiniCartOpen(false)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Số lượng thêm</span>
              <span className="font-bold text-slate-900">{miniCartSummary.quantity}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Tạm tính</span>
              <span className="font-bold text-slate-900">{miniCartSummary.total}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Tổng số lượng giỏ</span>
              <span className="font-bold text-slate-900">{miniCartSummary.count}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex-1 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d95210]"
            >
              Xem giỏ hàng
            </button>
            <button
              type="button"
              onClick={() => setMiniCartOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tiếp tục mua
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
