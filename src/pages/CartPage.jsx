import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearGuestCart,
  getCartCount,
  normalizeBackendCartItem,
  readGuestCart,
  removeGuestCartItem,
  saveCartSnapshotCount,
  saveGuestCart,
} from '../utils/cart';

const API_CART_URL = '/api/v1/cart';
const API_PRODUCTS_URL = '/api/v1/products';
const API_VOUCHER_URL = '/api/v1/vouchers';
const PLACEHOLDER_IMAGE = 'https://placehold.co/160x220?text=No+Image';

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

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

const normalizeMoney = (value) => Number(value) || 0;

const normalizeCartSummary = (payload, items) => {
  const normalizedItems = Array.isArray(items) ? items : [];
  const subTotal = payload?.subTotal != null ? normalizeMoney(payload.subTotal) : normalizedItems.reduce((sum, item) => sum + normalizeMoney(item.lineTotal), 0);
  const discountAmount = payload?.discountAmount != null ? normalizeMoney(payload.discountAmount) : 0;
  const total = payload?.total != null ? normalizeMoney(payload.total) : Math.max(0, subTotal - discountAmount);

  return {
    voucherCode: payload?.voucherCode ?? null,
    subTotal,
    discountAmount,
    total,
  };
};

const normalizeBackendItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => normalizeBackendCartItem(item))
    .filter(Boolean);

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    voucherCode: null,
    subTotal: 0,
    discountAmount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshingStock, setRefreshingStock] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [stockMap, setStockMap] = useState({});
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherActionLoading, setVoucherActionLoading] = useState(false);
  const cartRefreshTimerRef = useRef(null);
  const ignoreNextCartEventRef = useRef(false);

  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const displayItems = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        stockQty:
          stockMap[String(item.variantId)] != null
            ? Number(stockMap[String(item.variantId)])
            : item.stockQty != null
              ? Number(item.stockQty)
              : null,
      })),
    [cartItems, stockMap]
  );

  const itemCount = useMemo(() => getCartCount(displayItems), [displayItems]);

  const computedSummary = useMemo(() => {
    if (isLoggedIn) {
      return cartSummary;
    }

    const subTotal = displayItems.reduce((sum, item) => sum + normalizeMoney(item.lineTotal), 0);
    return {
      voucherCode: null,
      subTotal,
      discountAmount: 0,
      total: subTotal,
    };
  }, [cartSummary, displayItems, isLoggedIn]);

  const syncSnapshot = useCallback(
    (items) => {
      const count = getCartCount(items);
      ignoreNextCartEventRef.current = true;
      saveCartSnapshotCount(count);
    },
    []
  );

  const fetchStockMap = useCallback(async (items) => {
    const uniqueProductIds = [...new Set(items.map((item) => String(item.productId)).filter(Boolean))];
    if (uniqueProductIds.length === 0) {
      setStockMap({});
      return;
    }

    setRefreshingStock(true);

    try {
      const responses = await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const response = await fetch(`${API_PRODUCTS_URL}/${productId}`);
            if (!response.ok) return null;
            const payload = await parseResponseBody(response);
            const product = payload?.data ?? payload;
            const variants = Array.isArray(product?.variants) ? product.variants : [];

            return variants.reduce((acc, variant) => {
              if (variant?.id != null) {
                acc[String(variant.id)] = Number(variant.stockQty) || 0;
              }
              return acc;
            }, {});
          } catch (error) {
            console.error(`Không thể tải tồn kho sản phẩm ${productId}:`, error);
            return null;
          }
        })
      );

      const nextMap = responses.reduce((acc, result) => {
        if (result && typeof result === 'object') {
          Object.assign(acc, result);
        }
        return acc;
      }, {});

      setStockMap(nextMap);
    } finally {
      setRefreshingStock(false);
    }
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const token = localStorage.getItem('token');

      if (token) {
        const response = await fetch(API_CART_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await parseResponseBody(response);

        if (!response.ok) {
          throw new Error(extractMessage(payload, 'Không thể tải giỏ hàng.'));
        }

        const data = payload?.data ?? payload;
        const nextItems = normalizeBackendItems(data?.items);
        setCartItems(nextItems);
        setCartSummary(normalizeCartSummary(data, nextItems));
        setVoucherCodeInput(data?.voucherCode ?? '');
        syncSnapshot(nextItems);
        await fetchStockMap(nextItems);
        return;
      }

      const guestItems = readGuestCart();
      setCartItems(guestItems);
      setCartSummary(normalizeCartSummary(null, guestItems));
      setVoucherCodeInput('');
      syncSnapshot(guestItems);
      setStockMap(
        guestItems.reduce((acc, item) => {
          if (item?.variantId != null && item?.stockQty != null) {
            acc[String(item.variantId)] = Number(item.stockQty) || 0;
          }
          return acc;
        }, {})
      );
    } catch (err) {
      console.error('Lỗi tải giỏ hàng:', err);
      setError(err?.message || 'Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  }, [fetchStockMap, syncSnapshot]);

  const scheduleCartReload = useCallback(() => {
    if (cartRefreshTimerRef.current) {
      window.clearTimeout(cartRefreshTimerRef.current);
    }

    cartRefreshTimerRef.current = window.setTimeout(() => {
      cartRefreshTimerRef.current = null;
      loadCart();
    }, 75);
  }, [loadCart]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const handleCartUpdate = (event) => {
      if (ignoreNextCartEventRef.current) {
        ignoreNextCartEventRef.current = false;
        return;
      }

      scheduleCartReload();
    };

    const handleAuthUpdate = () => {
      scheduleCartReload();
    };

    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('focus', handleCartUpdate);
    window.addEventListener('visibilitychange', handleCartUpdate);
    window.addEventListener('fashion-store-cart-updated', handleCartUpdate);
    window.addEventListener('fashion-store-auth-updated', handleAuthUpdate);

    return () => {
      if (cartRefreshTimerRef.current) {
        window.clearTimeout(cartRefreshTimerRef.current);
      }

      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('focus', handleCartUpdate);
      window.removeEventListener('visibilitychange', handleCartUpdate);
      window.removeEventListener('fashion-store-cart-updated', handleCartUpdate);
      window.removeEventListener('fashion-store-auth-updated', handleAuthUpdate);
    };
  }, [scheduleCartReload]);

  const getItemStockQty = (item) => {
    const variantStock = stockMap[String(item?.variantId)];
    if (variantStock != null) {
      return Number(variantStock);
    }

    if (item?.stockQty != null) {
      return Number(item.stockQty);
    }

    return null;
  };

  const updateItemQuantity = async (item, nextQuantity) => {
    const quantity = Math.max(1, Number(nextQuantity) || 1);
    const stockQty = getItemStockQty(item);

    if (stockQty != null && stockQty > 0 && quantity > stockQty) {
      setError(`Chỉ còn ${stockQty} sản phẩm trong kho.`);
      return;
    }

    setError('');
    setNotice('');
    setUpdatingItemId(item.id ?? item.variantId);

    try {
      const token = localStorage.getItem('token');

      if (token) {
        const response = await fetch(`${API_CART_URL}/items/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        });

        const payload = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(extractMessage(payload, 'Không thể cập nhật số lượng sản phẩm.'));
        }

        const data = payload?.data ?? payload;
        const nextItems = normalizeBackendItems(data?.items);
        setCartItems(nextItems);
        setCartSummary(normalizeCartSummary(data, nextItems));
        setVoucherCodeInput(data?.voucherCode ?? '');
        syncSnapshot(nextItems);
        await fetchStockMap(nextItems);
        return;
      }

      ignoreNextCartEventRef.current = true;
      const nextItems = saveGuestCart(
        cartItems.map((cartItem) =>
          String(cartItem.variantId) === String(item.variantId)
            ? {
                ...cartItem,
                quantity,
                lineTotal: quantity * normalizeMoney(cartItem.unitPrice),
              }
            : cartItem
        )
      );

      setCartItems(nextItems);
      setCartSummary(normalizeCartSummary(null, nextItems));
    } catch (err) {
      console.error('Lỗi cập nhật sản phẩm trong giỏ hàng:', err);
      setError(err?.message || 'Không thể cập nhật số lượng sản phẩm.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (item) => {
    setError('');
    setNotice('');
    setUpdatingItemId(item.id ?? item.variantId);

    try {
      const token = localStorage.getItem('token');

      if (token) {
        const response = await fetch(`${API_CART_URL}/items/${item.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(extractMessage(payload, 'Không thể xóa sản phẩm khỏi giỏ hàng.'));
        }

        const data = payload?.data ?? payload;
        const nextItems = normalizeBackendItems(data?.items);
        setCartItems(nextItems);
        setCartSummary(normalizeCartSummary(data, nextItems));
        setVoucherCodeInput(data?.voucherCode ?? '');
        syncSnapshot(nextItems);
        await fetchStockMap(nextItems);
        setNotice('Đã xóa sản phẩm khỏi giỏ hàng.');
        return;
      }

      ignoreNextCartEventRef.current = true;
      const nextItems = removeGuestCartItem(cartItems, item.variantId);
      saveGuestCart(nextItems);
      setCartItems(nextItems);
      setCartSummary(normalizeCartSummary(null, nextItems));
      setNotice('Đã xóa sản phẩm khỏi giỏ hàng.');
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      setError(err?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?');
    if (!confirmed) return;

    setError('');
    setNotice('');
    setClearingCart(true);

    try {
      const token = localStorage.getItem('token');

      if (token) {
        const response = await fetch(API_CART_URL, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(extractMessage(payload, 'Không thể xóa toàn bộ giỏ hàng.'));
        }

        const data = payload?.data ?? payload;
        const nextItems = normalizeBackendItems(data?.items);
        setCartItems(nextItems);
        setCartSummary(normalizeCartSummary(data, nextItems));
        setVoucherCodeInput(data?.voucherCode ?? '');
        syncSnapshot(nextItems);
        await fetchStockMap(nextItems);
        setNotice('Đã xóa toàn bộ giỏ hàng.');
        return;
      }

      ignoreNextCartEventRef.current = true;
      clearGuestCart();
      setCartItems([]);
      setCartSummary({
        voucherCode: null,
        subTotal: 0,
        discountAmount: 0,
        total: 0,
      });
      setVoucherCodeInput('');
      setStockMap({});
      setNotice('Đã xóa toàn bộ giỏ hàng.');
    } catch (err) {
      console.error('Lỗi xóa giỏ hàng:', err);
      setError(err?.message || 'Không thể xóa toàn bộ giỏ hàng.');
    } finally {
      setClearingCart(false);
    }
  };

  const applyVoucher = async () => {
    const voucherCode = voucherCodeInput.trim();

    if (!voucherCode) {
      setError('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (!isLoggedIn) {
      setError('Vui lòng đăng nhập để áp mã giảm giá.');
      return;
    }

    setError('');
    setNotice('');
    setVoucherActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_VOUCHER_URL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voucherCode }),
      });

      const payload = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(extractMessage(payload, 'Không thể áp mã giảm giá.'));
      }

      const data = payload?.data ?? payload;
      const nextItems = normalizeBackendItems(data?.items ?? cartItems);
      setCartItems(nextItems);
      setCartSummary(normalizeCartSummary(data, nextItems));
      setVoucherCodeInput(data?.voucherCode ?? voucherCode);
      syncSnapshot(nextItems);
      await fetchStockMap(nextItems);
      setNotice('Đã áp mã giảm giá thành công.');
    } catch (err) {
      console.error('Lỗi áp mã giảm giá:', err);
      setError(err?.message || 'Không thể áp mã giảm giá.');
    } finally {
      setVoucherActionLoading(false);
    }
  };

  const removeVoucher = async () => {
    if (!isLoggedIn) {
      setError('Vui lòng đăng nhập để gỡ mã giảm giá.');
      return;
    }

    setError('');
    setNotice('');
    setVoucherActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_VOUCHER_URL}/remove`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(extractMessage(payload, 'Không thể gỡ mã giảm giá.'));
      }

      const data = payload?.data ?? payload;
      const nextItems = normalizeBackendItems(data?.items ?? cartItems);
      setCartItems(nextItems);
      setCartSummary(normalizeCartSummary(data, nextItems));
      setVoucherCodeInput('');
      syncSnapshot(nextItems);
      await fetchStockMap(nextItems);
      setNotice('Đã gỡ mã giảm giá.');
    } catch (err) {
      console.error('Lỗi gỡ mã giảm giá:', err);
      setError(err?.message || 'Không thể gỡ mã giảm giá.');
    } finally {
      setVoucherActionLoading(false);
    }
  };

  const emptyState = (
    <div className="rounded-3xl border border-white/70 bg-white/95 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[30px]">shopping_cart</span>
      </div>
      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Giỏ hàng đang trống</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {isLoggedIn
          ? 'Bạn chưa thêm sản phẩm nào vào giỏ hàng.'
          : 'Giỏ hàng tạm của bạn chưa có sản phẩm. Sản phẩm sẽ được lưu trên trình duyệt cho đến khi bạn đăng nhập.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210]"
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          Tiếp tục mua sắm
        </Link>
        {!isLoggedIn ? (
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Đăng nhập để đồng bộ giỏ hàng
          </Link>
        ) : null}
      </div>
    </div>
  );

  const checkoutDisabled = cartItems.length === 0;

  return (
    <main className="min-h-screen bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ec5b13]">Giỏ hàng</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Giỏ hàng của bạn
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLoggedIn
                  ? 'Giỏ hàng được lưu trong cơ sở dữ liệu và tự động đồng bộ.'
                  : 'Giỏ hàng tạm được lưu trên trình duyệt và sẽ được đồng bộ khi bạn đăng nhập.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Tiếp tục mua sắm
              </button>
              <button
                type="button"
                onClick={clearCart}
                disabled={clearingCart || cartItems.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                {clearingCart ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
            </div>
          </div>

          {/* {(error || notice) && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {error || notice}
            </div>
          )} */}
        </header>

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="space-y-4 animate-pulse">
                <div className="h-5 w-40 rounded-full bg-slate-100" />
                <div className="h-24 rounded-2xl bg-slate-100" />
                <div className="h-24 rounded-2xl bg-slate-100" />
                <div className="h-24 rounded-2xl bg-slate-100" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="space-y-4 animate-pulse">
                <div className="h-5 w-36 rounded-full bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-12 rounded-2xl bg-slate-100" />
              </div>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          emptyState
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Sản phẩm trong giỏ</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {cartItems.length} dòng sản phẩm · {itemCount} sản phẩm
                  </p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-slate-100">
                {displayItems.map((item) => {
                  const stockQty = getItemStockQty(item);
                  const isStockOut = stockQty === 0;
                  const isBusy = updatingItemId === item.id || updatingItemId === item.variantId;

                  return (
                    <div key={item.id ?? item.variantId} className="grid gap-4 py-6 lg:grid-cols-[1fr_auto]">
                      <div className="flex gap-4">
                        <Link
                          to={`/product/${item.productId}`}
                          className="shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                        >
                          <img
                            src={item.thumbnailUrl || PLACEHOLDER_IMAGE}
                            alt={item.productName}
                            className="h-28 w-20 object-cover sm:h-32 sm:w-24"
                            onError={(event) => {
                              event.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to={`/product/${item.productId}`}
                                className="line-clamp-2 text-lg font-black tracking-tight text-slate-900 transition hover:text-[#ec5b13]"
                              >
                                {item.productName}
                              </Link>
                              <p className="mt-1 text-sm text-slate-500">
                                Màu {item.color || '—'} · Size {item.size || '—'}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                SKU: {item.sku || 'Chưa có SKU'}
                              </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                              <span className={`size-2 rounded-full ${isStockOut ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {isStockOut
                                ? 'Hết hàng'
                                : stockQty != null
                                  ? `Còn ${stockQty} sản phẩm`
                                  : 'Đang kiểm tra'}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Đơn giá</p>
                              <p className="mt-1 text-base font-bold text-slate-900">{formatVND(item.unitPrice)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Thành tiền</p>
                              <p className="mt-1 text-base font-black text-slate-900">{formatVND(item.lineTotal)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch gap-3 lg:items-end">
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item, item.quantity - 1)}
                            disabled={isBusy || item.quantity <= 1}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#ec5b13] hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>
                          <span className="min-w-10 px-3 text-center text-sm font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item, item.quantity + 1)}
                            disabled={isBusy || isStockOut}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#ec5b13] hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>


                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ec5b13]">Tóm tắt</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Thanh toán</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {isLoggedIn ? 'Đã đăng nhập' : 'Khách'}
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tạm tính</span>
                  <span className="font-bold text-slate-900">{formatVND(computedSummary.subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Giảm giá</span>
                  <span className="font-bold text-slate-900">-{formatVND(computedSummary.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-base font-bold text-slate-900">Tổng cộng</span>
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {formatVND(computedSummary.total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#ec5b13]">local_activity</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Mã giảm giá</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {isLoggedIn
                          ? 'Nhập mã để áp dụng khuyến mãi cho giỏ hàng hiện tại.'
                          : 'Đăng nhập để áp dụng mã giảm giá vào giỏ hàng.'}
                      </p>
                    </div>
                  </div>
                  {cartSummary.voucherCode ? (
                    <button
                      type="button"
                      onClick={removeVoucher}
                      disabled={voucherActionLoading}
                      className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Gỡ mã
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    disabled={!isLoggedIn || voucherActionLoading}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase outline-none transition focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={applyVoucher}
                    disabled={!isLoggedIn || voucherActionLoading || !voucherCodeInput.trim()}
                    className="rounded-xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {voucherActionLoading ? 'Đang áp...' : 'Áp mã'}
                  </button>
                </div>

                {cartSummary.voucherCode ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    Đang áp dụng mã: {cartSummary.voucherCode}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    Mã giảm giá sẽ được xác nhận theo điều kiện đơn hàng và thời hạn sử dụng.
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px] text-[#ec5b13]">info</span>
                  <p className="text-sm leading-6 text-slate-600">
                    {isLoggedIn
                      ? 'Số lượng và tổng tiền được cập nhật trực tiếp với cơ sở dữ liệu.'
                      : 'Giỏ hàng tạm lưu trong trình duyệt. Khi đăng nhập, hệ thống sẽ tự động đồng bộ vào CSDL.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(isLoggedIn ? '/checkout' : '/auth')}
                disabled={checkoutDisabled}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Tiếp tục thanh toán
              </button>

              {!isLoggedIn ? (
                <Link
                  to="/auth"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Đăng nhập để lưu giỏ hàng vào CSDL
                </Link>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <span className="material-symbols-outlined mb-2 text-[22px] text-slate-600">verified_user</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Thanh toán an toàn
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <span className="material-symbols-outlined mb-2 text-[22px] text-slate-600">local_shipping</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Hỗ trợ đổi trả
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
