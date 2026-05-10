import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearGuestCart,
  getCartCount,
  normalizeBackendCartItem,
  readGuestCart,
  removeGuestCartItem,
  saveCartSnapshotCount,
  saveGuestCart,
} from '../utils/cart';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const API_CART_URL = '/api/v1/cart';
const API_PRODUCTS_URL = '/api/v1/products';
const API_VOUCHER_URL = '/api/v1/vouchers';

const parseResponseBody = async (response) => {
  const text = await response.text();
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

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({ voucherCode: null, subTotal: 0, discountAmount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherActionLoading, setVoucherActionLoading] = useState(false);
  const cartRefreshTimerRef = useRef(null);

  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(API_CART_URL, { headers: { Authorization: `Bearer ${token}` } });
        const payload = await parseResponseBody(response);
        if (!response.ok) throw new Error(extractMessage(payload, 'Không thể tải giỏ hàng.'));
        const data = payload?.data ?? payload;
        const nextItems = (data?.items || []).map(item => normalizeBackendCartItem(item)).filter(Boolean);
        setCartItems(nextItems);
        setCartSummary({
          voucherCode: data?.voucherCode ?? null,
          subTotal: normalizeMoney(data?.subTotal),
          discountAmount: normalizeMoney(data?.discountAmount),
          total: normalizeMoney(data?.total),
        });
        setVoucherCodeInput(data?.voucherCode ?? '');
        saveCartSnapshotCount(getCartCount(nextItems));
      } else {
        const guestItems = readGuestCart();
        setCartItems(guestItems);
        const subTotal = guestItems.reduce((sum, i) => sum + normalizeMoney(i.lineTotal), 0);
        setCartSummary({ voucherCode: null, subTotal, discountAmount: 0, total: subTotal });
        saveCartSnapshotCount(getCartCount(guestItems));
      }
    } catch (err) { setError(err?.message || 'Lỗi tải giỏ hàng.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const updateItemQuantity = async (item, quantity) => {
    const nextQty = Math.max(1, quantity);
    setUpdatingItemId(item.id ?? item.variantId);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_CART_URL}/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quantity: nextQty }),
        });
        if (response.ok) loadCart();
      } else {
        const nextItems = cartItems.map(i => i.variantId === item.variantId ? { ...i, quantity: nextQty, lineTotal: nextQty * normalizeMoney(i.unitPrice) } : i);
        saveGuestCart(nextItems);
        setCartItems(nextItems);
        const subTotal = nextItems.reduce((sum, i) => sum + normalizeMoney(i.lineTotal), 0);
        setCartSummary(prev => ({ ...prev, subTotal, total: subTotal }));
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingItemId(null); }
  };

  const removeItem = async (item) => {
    if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
    setUpdatingItemId(item.id ?? item.variantId);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_CART_URL}/items/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) loadCart();
      } else {
        const nextItems = removeGuestCartItem(cartItems, item.variantId);
        saveGuestCart(nextItems);
        setCartItems(nextItems);
        const subTotal = nextItems.reduce((sum, i) => sum + normalizeMoney(i.lineTotal), 0);
        setCartSummary(prev => ({ ...prev, subTotal, total: subTotal }));
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingItemId(null); }
  };

  const applyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setVoucherActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_VOUCHER_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ voucherCode: voucherCodeInput.trim() }),
      });
      if (response.ok) loadCart();
      else {
        const payload = await parseResponseBody(response);
        alert(extractMessage(payload, 'Mã giảm giá không hợp lệ.'));
      }
    } catch (err) { console.error(err); }
    finally { setVoucherActionLoading(false); }
  };

  const removeVoucher = async () => {
    setVoucherActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_VOUCHER_URL}/remove`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) loadCart();
    } catch (err) { console.error(err); }
    finally { setVoucherActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-lumiere-cream">
       <div className="w-12 h-12 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lumiere-cream pb-24 pt-32">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <header className="mb-12">
          <p className="text-[11px] tracking-[0.25em] uppercase text-lumiere-gray mb-3">Túi mua sắm</p>
          <h1 className="serif text-[clamp(32px,5vw,52px)] text-lumiere-charcoal leading-tight">
            Giỏ hàng của bạn <span className="text-lumiere-gray/40">({getCartCount(cartItems)})</span>
          </h1>
        </header>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-lumiere-gray/15 p-16 text-center">
            <p className="serif text-2xl text-lumiere-gray italic mb-8">Giỏ hàng của bạn đang trống.</p>
            <button 
              onClick={() => navigate('/products')}
              className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-10 py-4 hover:bg-lumiere-terracotta transition-all"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
            <section className="bg-white border border-lumiere-gray/15 px-8 md:px-12">
              <div className="hidden md:grid grid-cols-[1fr_120px_140px] py-6 border-b border-lumiere-gray/10 text-[11px] tracking-[0.2em] uppercase font-semibold text-lumiere-gray">
                <span>Sản phẩm</span>
                <span className="text-center">Số lượng</span>
                <span className="text-right">Tổng</span>
              </div>
              
              {cartItems.map(item => (
                <CartItem 
                  key={item.id ?? item.variantId} 
                  item={item} 
                  onUpdateQuantity={updateItemQuantity}
                  onRemove={removeItem}
                  isBusy={updatingItemId === (item.id ?? item.variantId)}
                />
              ))}

              <div className="py-8 flex justify-between">
                <button 
                  onClick={() => navigate('/products')}
                  className="text-[11px] tracking-[0.2em] uppercase font-semibold text-lumiere-gray hover:text-lumiere-charcoal transition-colors flex items-center gap-2"
                >
                  ← Quay lại mua sắm
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Xóa tất cả sản phẩm khỏi giỏ hàng?')) {
                      if (isLoggedIn) {
                        const token = localStorage.getItem('token');
                        await fetch(API_CART_URL, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                        loadCart();
                      } else {
                        clearGuestCart();
                        loadCart();
                      }
                    }
                  }}
                  className="text-[11px] tracking-[0.2em] uppercase font-semibold text-lumiere-terracotta hover:opacity-70 transition-colors"
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>
            </section>

            <CartSummary 
              summary={cartSummary}
              isLoggedIn={isLoggedIn}
              voucherCodeInput={voucherCodeInput}
              setVoucherCodeInput={setVoucherCodeInput}
              onApplyVoucher={applyVoucher}
              onRemoveVoucher={removeVoucher}
              onCheckout={() => navigate(isLoggedIn ? '/checkout' : '/auth')}
              loading={voucherActionLoading}
              checkoutDisabled={cartItems.length === 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
