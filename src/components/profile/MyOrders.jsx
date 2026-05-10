import React, { useEffect, useState } from 'react';
import OrderCard from './OrderCard';
import OrderDetailModal from './OrderDetailModal';

const API_ORDERS_URL = '/api/v1/orders';

export default function MyOrders({ token }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [actionBusyId, setActionBusyId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ORDERS_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Không thể tải đơn hàng.');
      const data = payload.result || payload.data?.result || payload.content || payload.data?.content || [];
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [token]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    setActionBusyId(orderId);
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 'Người dùng hủy đơn từ trang cá nhân' }),
      });
      if (res.ok) await fetchMyOrders();
    } catch (e) { console.error(e); }
    finally { setActionBusyId(null); }
  };

  const retryVnpay = async (orderId) => {
    setActionBusyId(orderId);
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: 'vnpay' }),
      });
      const payload = await res.json();
      if (res.ok) {
        const url = payload?.paymentUrl ?? payload?.data?.paymentUrl;
        if (url) window.location.href = url;
      }
    } catch (e) { console.error(e); }
    finally { setActionBusyId(null); }
  };

  const handleOpenDetail = (id) => {
    setSelectedOrderId(id);
    setShowDetailModal(true);
  };

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12 animate-fade-in">
      <header className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Lịch sử đơn hàng</h2>
        <p className="text-[13px] text-lumiere-gray">Theo dõi và quản lý các đơn hàng của bạn.</p>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-2 border-lumiere-terracotta border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-600 text-center serif italic">{error}</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-lumiere-gray/20">
          <p className="serif text-xl text-lumiere-gray italic">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onCancel={cancelOrder}
              onRetryPayment={retryVnpay}
              onDetail={handleOpenDetail}
              actionBusyId={actionBusyId}
            />
          ))}
        </div>
      )}

      <OrderDetailModal 
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        orderId={selectedOrderId}
        token={token}
      />
    </div>
  );
}
