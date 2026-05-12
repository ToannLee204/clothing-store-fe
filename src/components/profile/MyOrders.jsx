import React, { useEffect, useState } from 'react';
import OrderCard from './OrderCard';
import OrderDetailModal from './OrderDetailModal';
import ReturnRequestModal from './ReturnRequestModal';
import CancelOrderModal from './CancelOrderModal';
import ReturnRequestDetailModal from './ReturnRequestDetailModal';

const API_ORDERS_URL = '/api/v1/orders';

export default function MyOrders({ token }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [actionBusyId, setActionBusyId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnDetailModal, setShowReturnDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [pagination, setPagination] = useState({ totalPages: 1, totalElements: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const fetchMyOrders = async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ORDERS_URL}?page=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Không thể tải đơn hàng.');
      
      const data = payload.result || payload.data?.result || payload.content || payload.data?.content || [];
      const meta = payload.meta || payload.data?.meta || {};
      
      setOrders(data);
      setPagination({
        totalPages: meta.pages || meta.totalPages || 1,
        totalElements: meta.totals || meta.totalElements || data.length
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyOrders(currentPage);
  }, [token, currentPage]);

  const handleOpenCancel = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (reason) => {
    setCancelLoading(true);
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderToCancel}/cancel`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason }),
      });
      
      if (res.ok) {
        setShowCancelModal(false);
        setOrderToCancel(null);
        await fetchMyOrders();
        alert('Hủy đơn hàng thành công!');
      } else {
        const data = await res.json();
        alert(data?.message || 'Có lỗi xảy ra khi hủy đơn hàng.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setCancelLoading(false);
    }
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

  const handleOpenReturn = (order) => {
    setOrderToReturn(order);
    setShowReturnModal(true);
  };

  const handleViewReturn = (order) => {
    setOrderToReturn(order);
    setShowReturnDetailModal(true);
  };

  const handleReturnSubmit = async ({ reason, images, refundBankInfo }) => {
    setReturnLoading(true);
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      if (refundBankInfo) {
        formData.append('refundBankInfo', refundBankInfo);
      }
      images.forEach(img => formData.append('images', img));

      const orderId = orderToReturn.orderId ?? orderToReturn.id;
      const res = await fetch(`${API_ORDERS_URL}/${orderId}/return-request`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: formData,
      });
      
      if (res.ok) {
        setShowReturnModal(false);
        setOrderToReturn(null);
        await fetchMyOrders();
        alert('Gửi yêu cầu trả hàng thành công!');
      } else {
        const data = await res.json();
        alert(data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setReturnLoading(false);
    }
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
        <div className="space-y-10">
          <div className="flex flex-col gap-6">
            {orders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onCancel={handleOpenCancel}
                onRetryPayment={retryVnpay}
                onReturn={() => handleOpenReturn(order)}
                onDetail={handleOpenDetail}
                onViewReturn={() => handleViewReturn(order)}
                actionBusyId={actionBusyId}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6 border-t border-lumiere-gray/10">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 flex items-center justify-center border border-lumiere-gray/20 text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-10 h-10 flex items-center justify-center text-[13px] font-bold tracking-widest transition-all ${
                      currentPage === i
                        ? 'bg-lumiere-charcoal text-white'
                        : 'text-lumiere-gray hover:bg-lumiere-blush/50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === pagination.totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-10 h-10 flex items-center justify-center border border-lumiere-gray/20 text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      <OrderDetailModal 
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        orderId={selectedOrderId}
        token={token}
      />

      <ReturnRequestModal 
        show={showReturnModal}
        loading={returnLoading}
        order={orderToReturn}
        onClose={() => setShowReturnModal(false)}
        onSubmit={handleReturnSubmit}
      />

      <ReturnRequestDetailModal 
        show={showReturnDetailModal}
        onClose={() => setShowReturnDetailModal(false)}
        orderId={orderToReturn?.orderId ?? orderToReturn?.id}
        token={token}
      />

      <CancelOrderModal 
        show={showCancelModal}
        loading={cancelLoading}
        onClose={() => setShowCancelModal(false)}
        onSubmit={handleCancelSubmit}
      />
    </div>
  );
}
