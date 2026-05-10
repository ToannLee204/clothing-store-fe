import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeBackendCartItem } from '../utils/cart';
import CheckoutAddressSelector from '../components/checkout/CheckoutAddressSelector';
import CheckoutPaymentMethod from '../components/checkout/CheckoutPaymentMethod';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

const API_CART_URL = '/api/v1/cart';
const API_ORDERS_URL = '/api/v1/orders';
const API_ADDRESSES_URL = '/api/v1/addresses';

const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
};

const normalizeMoney = (value) => Number(value) || 0;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({ voucherCode: null, subTotal: 0, discountAmount: 0, total: 0 });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartRes, addrRes] = await Promise.all([
        fetch(API_CART_URL, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ADDRESSES_URL, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const cartPayload = await parseJson(cartRes);
      if (cartRes.ok) {
        const cartData = cartPayload?.data ?? cartPayload;
        const nextItems = (cartData?.items || []).map(normalizeBackendCartItem).filter(Boolean);
        setCartItems(nextItems);
        setCartSummary({
          voucherCode: cartData?.voucherCode ?? null,
          subTotal: normalizeMoney(cartData?.subTotal),
          discountAmount: normalizeMoney(cartData?.discountAmount),
          total: normalizeMoney(cartData?.total),
        });
      }

      const addrPayload = await parseJson(addrRes);
      if (addrRes.ok) {
        const list = addrPayload?.data || addrPayload?.result || addrPayload?.content || [];
        const sorted = list.sort((a, b) => (b.isDefault || b.default ? 1 : 0) - (a.isDefault || a.default ? 1 : 0));
        setAddresses(sorted);
        const def = sorted.find(a => a.isDefault || a.default) || sorted[0];
        if (def) setSelectedAddressId(String(def.id));
      }
    } catch (e) { setError('Lỗi khởi tạo dữ liệu.'); }
    finally { setLoading(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        addressId: Number(selectedAddressId),
        cartItemIds: cartItems.map(i => i.id).filter(Boolean),
        paymentMethod,
        voucherCode: cartSummary.voucherCode,
        note: note.trim() || null,
      };
      const res = await fetch(API_ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(data, 'Đặt hàng thất bại.'));

      const orderData = data?.data ?? data;
      if (paymentMethod === 'vnpay') {
        const url = orderData?.paymentUrl ?? data?.paymentUrl;
        if (url) window.location.href = url;
      } else {
        navigate('/profile', { state: { activeTab: 'orders' } });
      }
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-lumiere-cream">
       <div className="w-12 h-12 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lumiere-cream pb-24 pt-32">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-lumiere-gray mb-3">Quy trình đặt hàng</p>
            <h1 className="serif text-[clamp(32px,5vw,52px)] text-lumiere-charcoal leading-tight">Thanh toán</h1>
          </div>
          <button 
            onClick={() => navigate('/cart')}
            className="text-[11px] tracking-[0.2em] uppercase font-semibold text-lumiere-gray hover:text-lumiere-charcoal flex items-center gap-2"
          >
            ← Quay lại giỏ hàng
          </button>
        </header>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
          <div className="space-y-12 animate-fade-in">
            <CheckoutAddressSelector 
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAddNew={() => navigate('/profile', { state: { activeTab: 'addresses' } })}
            />

            <CheckoutPaymentMethod 
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              note={note}
              onNoteChange={setNote}
            />
          </div>

          <aside className="animate-fade-in delay-100">
            <CheckoutSummary 
              items={cartItems}
              summary={cartSummary}
              onPlaceOrder={handlePlaceOrder}
              submitting={submitting}
              disabled={cartItems.length === 0 || !selectedAddressId}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
