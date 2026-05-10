import React from 'react';
import { Link } from 'react-router-dom';

const formatPrice = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} ₫`;

export default function OrderCard({ order, onCancel, onRetryPayment, onDetail, actionBusyId }) {
  const orderId = order.orderId ?? order.id;
  
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'cancelled': return 'text-rose-600 bg-rose-50';
      case 'shipping': return 'text-amber-600 bg-amber-50';
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      default: return 'text-lumiere-gray bg-lumiere-blush/50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'completed': return 'Đã hoàn tất';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const canCancel = order?.status === 'pending';
  const canRetryPayment = order?.status === 'payment_failed' && order?.paymentMethod === 'vnpay';

  return (
    <div className="bg-white border border-lumiere-gray/15 p-6 lg:p-8 hover:border-lumiere-gray/30 transition-all">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button 
              onClick={() => onDetail(orderId)}
              className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal hover:text-lumiere-terracotta underline decoration-lumiere-gray/30"
            >
              Đơn hàng: {order.orderCode}
            </button>
            <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 font-semibold ${getStatusStyle(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-lumiere-gray bg-lumiere-blush/50'}`}>
              {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[13px]">
            <div>
              <p className="text-lumiere-gray mb-1">Ngày đặt:</p>
              <p className="font-medium text-lumiere-charcoal">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-lumiere-gray mb-1">Phương thức:</p>
              <p className="font-medium text-lumiere-charcoal uppercase tracking-wider">{order.paymentMethod}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-lumiere-gray mb-1">Tổng cộng:</p>
              <p className="font-bold text-lumiere-terracotta text-lg">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[180px]">
          <button 
            onClick={() => onDetail(orderId)}
            className="w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium py-3 text-center hover:bg-lumiere-terracotta transition-all"
          >
            Chi tiết đơn hàng
          </button>
          
          {canRetryPayment && (
            <button 
              onClick={() => onRetryPayment(orderId)}
              disabled={actionBusyId === orderId}
              className="w-full bg-lumiere-terracotta text-white text-[11px] tracking-[0.2em] uppercase font-medium py-3 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Thanh toán lại
            </button>
          )}

          {canCancel && (
            <button 
              onClick={() => onCancel(orderId)}
              disabled={actionBusyId === orderId}
              className="w-full border border-rose-200 text-rose-600 text-[11px] tracking-[0.2em] uppercase font-medium py-3 hover:bg-rose-50 transition-all disabled:opacity-50"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
