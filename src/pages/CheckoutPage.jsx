import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeBackendCartItem } from '../utils/cart';

const API_CART_URL = '/api/v1/cart';
const API_ORDERS_URL = '/api/v1/orders';
const API_ADDRESSES_URL = '/api/v1/addresses';

const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
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

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

function normalizeMoney(value) {
  return Number(value) || 0;
}

function normalizeCartSummaryFromCartPayload(payload, normalizedItems) {
  const subTotal =
    payload?.subTotal != null
      ? normalizeMoney(payload.subTotal)
      : normalizedItems.reduce((sum, item) => sum + normalizeMoney(item.lineTotal), 0);

  const discountAmount = payload?.discountAmount != null ? normalizeMoney(payload.discountAmount) : 0;

  const total =
    payload?.total != null ? normalizeMoney(payload.total) : Math.max(0, subTotal - discountAmount);

  return {
    voucherCode: payload?.voucherCode ?? null,
    subTotal,
    discountAmount,
    total,
  };
}

function sortAddresses(addresses) {
  return [...(addresses || [])].sort((a, b) => {
    const isADefault = a?.isDefault || a?.default ? 1 : 0;
    const isBDefault = b?.isDefault || b?.default ? 1 : 0;
    return isBDefault - isADefault;
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    voucherCode: null,
    subTotal: 0,
    discountAmount: 0,
    total: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'vnpay'
  const [note, setNote] = useState('');

  const hasCheckoutData = useMemo(() => {
    const hasAddress = Boolean(selectedAddressId);
    const hasCart = Array.isArray(cartItems) && cartItems.length > 0;
    const hasValidPaymentMethod = paymentMethod === 'cod' || paymentMethod === 'vnpay';
    return hasAddress && hasCart && hasValidPaymentMethod;
  }, [cartItems, paymentMethod, selectedAddressId]);

  useEffect(() => {
    const boot = async () => {
      if (!token) {
        navigate('/auth');
        return;
      }

      setLoading(true);
      setError('');
      setNotice('');

      try {
        const [cartRes, addrRes] = await Promise.all([
          fetch(API_CART_URL, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_ADDRESSES_URL, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const cartPayload = await parseJson(cartRes);
        if (!cartRes.ok) throw new Error(extractMessage(cartPayload, 'Không thể tải giỏ hàng.'));

        const addrPayload = await parseJson(addrRes);
        if (!addrRes.ok) throw new Error(extractMessage(addrPayload, 'Không thể tải địa chỉ.'));

        const cartData = cartPayload?.data ?? cartPayload;
        const nextItems = Array.isArray(cartData?.items) ? cartData.items.map(normalizeBackendCartItem).filter(Boolean) : [];

        setCartItems(nextItems);
        setCartSummary(normalizeCartSummaryFromCartPayload(cartData, nextItems));

        const nextAddresses = (() => {
          const list = addrPayload?.data ?? addrPayload;
          if (Array.isArray(list)) return list;
          if (Array.isArray(addrPayload?.result)) return addrPayload.result;
          if (Array.isArray(addrPayload?.content)) return addrPayload.content;
          return [];
        })();

        const sorted = sortAddresses(nextAddresses);
        setAddresses(sorted);

        const defaultAddr = sorted.find((a) => a?.isDefault || a?.default) ?? sorted[0];
        if (defaultAddr?.id != null) setSelectedAddressId(String(defaultAddr.id));
      } catch (e) {
        setError(e?.message || 'Không thể khởi tạo trang checkout.');
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [navigate, token]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => String(a?.id) === String(selectedAddressId)) ?? null,
    [addresses, selectedAddressId]
  );

  const cartItemIds = useMemo(
    () => cartItems.map((i) => i?.id).filter((id) => id != null),
    [cartItems]
  );

  const placeOrder = async () => {
    if (submitting) return;
    if (!hasCheckoutData) {
      setError('Vui lòng chọn đầy đủ địa chỉ và phương thức thanh toán.');
      return;
    }

    if (!cartItemIds.length) {
      setError('Giỏ hàng không hợp lệ (thiếu cartItemIds). Vui lòng tải lại trang.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        addressId: Number(selectedAddressId),
        cartItemIds,
        paymentMethod,
        voucherCode: cartSummary?.voucherCode ?? null,
        note: note?.trim() ? note.trim() : null,
      };

      const res = await fetch(API_ORDERS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(data, 'Không thể tạo đơn hàng.'));

      const nextOrder = data?.data ?? data;

      if (paymentMethod === 'vnpay') {
        const paymentUrl = nextOrder?.paymentUrl ?? nextOrder?.data?.paymentUrl ?? data?.paymentUrl;
        if (!paymentUrl) throw new Error('Không tìm thấy paymentUrl từ server.');

        window.location.href = paymentUrl;
        return;
      }

      const nextOrderId = nextOrder?.orderId ?? nextOrder?.id;
      if (!nextOrderId) throw new Error('Không tìm thấy orderId trong phản hồi.');

      navigate(`/orders/${nextOrderId}`);
    } catch (e) {
      setError(e?.message || 'Đặt hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pb-24">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="rounded-2xl bg-white border border-slate-100 p-6">Đang tải...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen pb-24">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-700 font-bold">{error}</div>
        </main>
      </div>
    );
  }

  const checkoutDisabled = !hasCheckoutData || submitting || cartItems.length === 0;

  return (
    <div className="bg-[#f8f6f6] font-sans text-slate-900 min-h-screen pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Thanh toán</h1>
            <p className="text-sm text-slate-500 mt-1">Chọn địa chỉ & phương thức thanh toán</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            ← Quay lại giỏ hàng
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-lg font-black text-slate-900 mb-4">1) Địa chỉ nhận hàng</h2>

            {addresses.length === 0 ? (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700 font-bold">
                Bạn chưa có địa chỉ giao hàng. Vui lòng vào <button className="underline" onClick={() => navigate('/profile')}>Hồ sơ</button> để thêm địa chỉ.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const addrId = String(addr.id);
                  const active = addrId === String(selectedAddressId);
                  return (
                    <button
                      key={addrId}
                      type="button"
                      onClick={() => setSelectedAddressId(addrId)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        active ? 'border-[#ec5b13]/40 bg-orange-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate">{addr.fullName}</div>
                          <div className="text-sm text-slate-600 mt-1">{addr.phone}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                          </div>
                        </div>

                        {(addr.isDefault || addr.default) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#ec5b13]/10 text-[#ec5b13] px-2 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Mặc định
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">2) Phương thức thanh toán</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#ec5b13]/40 bg-orange-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">COD (Thanh toán khi nhận hàng)</div>
                      <div className="text-sm text-slate-600 mt-1">PaymentStatus: unpaid</div>
                    </div>
                    <span className="material-symbols-outlined text-[#ec5b13]">payments</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    paymentMethod === 'vnpay'
                      ? 'border-[#ec5b13]/40 bg-orange-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">VNPAY (Thanh toán online)</div>
                      <div className="text-sm text-slate-600 mt-1">Tạo paymentUrl & redirect</div>
                    </div>
                    <span className="material-symbols-outlined text-[#ec5b13]">account_balance_wallet</span>
                  </div>
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
                  placeholder="VD: Gọi trước khi giao hàng..."
                />
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-lg font-black text-slate-900 mb-4">Tóm tắt đơn</h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-bold text-slate-900">{formatVND(cartSummary.subTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Giảm giá</span>
                <span className="font-bold text-slate-900">-{formatVND(cartSummary.discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-base font-bold text-slate-900">Tổng cộng</span>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {formatVND(cartSummary.total)}
                </span>
              </div>
            </div>

            {cartSummary.voucherCode ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-emerald-700">
                Đang áp voucher: {cartSummary.voucherCode}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
                Không có voucher.
              </div>
            )}

            <button
              type="button"
              onClick={placeOrder}
              disabled={checkoutDisabled}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              {submitting
                ? 'Đang tạo đơn...'
                : paymentMethod === 'cod'
                  ? 'Đặt hàng (COD)'
                  : 'Đặt hàng (VNPAY)'}
            </button>

            {selectedAddress ? (
              <div className="mt-4 text-xs text-slate-500 leading-5">
                <div className="font-bold text-slate-700 uppercase tracking-widest">Nhận hàng</div>
                <div className="mt-1">
                  {selectedAddress.fullName} · {selectedAddress.phone}
                  <div className="mt-1">
                    {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                  </div>
                </div>
              </div>
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
      </main>
    </div>
  );
}
