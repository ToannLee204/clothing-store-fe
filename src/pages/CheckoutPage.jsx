import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeBackendCartItem } from '../utils/cart';
import CheckoutAddressSelector from '../components/checkout/CheckoutAddressSelector';
import CheckoutPaymentMethod from '../components/checkout/CheckoutPaymentMethod';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import AddressModal from '../components/profile/AddressModal';

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

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState({ 
    fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false 
  });
  const [locationTree, setLocationTree] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [wardsOptions, setWardsOptions] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchData();
    fetchLocationTree();
  }, [token, navigate]);

  const fetchLocationTree = async () => {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
      const data = await res.json();
      setLocationTree(data);
    } catch (err) { console.error("Lỗi lấy dữ liệu Tỉnh thành:", err); }
  };

  useEffect(() => {
    if (addrForm.province && locationTree.length > 0) {
      const p = locationTree.find(x => x.name === addrForm.province);
      setDistrictsOptions(p ? p.districts : []);
    } else { setDistrictsOptions([]); }
  }, [addrForm.province, locationTree]);

  useEffect(() => {
    if (addrForm.district && districtsOptions.length > 0) {
      const d = districtsOptions.find(x => x.name === addrForm.district);
      setWardsOptions(d ? d.wards : []);
    } else { setWardsOptions([]); }
  }, [addrForm.district, districtsOptions]);

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

  const fetchAddressesOnly = async () => {
    try {
      const res = await fetch(API_ADDRESSES_URL, { headers: { Authorization: `Bearer ${token}` } });
      const addrPayload = await parseJson(res);
      if (res.ok) {
        const list = addrPayload?.data || addrPayload?.result || addrPayload?.content || [];
        const sorted = list.sort((a, b) => (b.isDefault || b.default ? 1 : 0) - (a.isDefault || a.default ? 1 : 0));
        setAddresses(sorted);
        // If we just added an address, maybe select it? Or keep current selection.
      }
    } catch (e) { console.error("Lỗi tải lại địa chỉ:", e); }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    // Validation
    const { fullName, phone, province, district, ward, street } = addrForm;
    
    if (fullName.trim().length < 2) {
      alert("Họ tên phải có ít nhất 2 ký tự.");
      return;
    }

    const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      alert("Số điện thoại không hợp lệ (phải có 10 chữ số và bắt đầu bằng đầu số VN).");
      return;
    }

    if (!province || !district || !ward) {
      alert("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
      return;
    }

    if (street.trim().length < 5) {
      alert("Địa chỉ chi tiết quá ngắn.");
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_ADDRESSES_URL}/${editingId}` : API_ADDRESSES_URL;
      const payload = { ...addrForm, default: addrForm.isDefault, isDefault: addrForm.isDefault };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload) 
      });
      if (res.ok) { 
        await fetchAddressesOnly(); 
        setShowAddressModal(false); 
      }
      else { 
        const errorData = await parseJson(res);
        alert(extractMessage(errorData, "Lỗi khi lưu địa chỉ.")); 
      }
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    setAddrForm({ 
      fullName: user.fullName || '', 
      phone: user.soDienThoai || user.phone || '', 
      province: '', district: '', ward: '', street: '', 
      isDefault: addresses.length === 0 
    });
    setEditingId(null);
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setAddrForm({ 
      fullName: addr.fullName, 
      phone: addr.phone, 
      province: addr.province, 
      district: addr.district, 
      ward: addr.ward, 
      street: addr.street, 
      isDefault: !!(addr.isDefault || addr.default) 
    });
    setEditingId(addr.id);
    setShowAddressModal(true);
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
              onAddNew={openAddModal}
              onEdit={openEditModal}
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

      <AddressModal 
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        editingId={editingId}
        form={addrForm}
        setForm={setAddrForm}
        onSave={handleSaveAddress}
        locationTree={locationTree}
        districtsOptions={districtsOptions}
        wardsOptions={wardsOptions}
      />
    </div>
  );
}
