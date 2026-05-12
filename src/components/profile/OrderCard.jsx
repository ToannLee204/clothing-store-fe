import React from 'react';
import { Link } from 'react-router-dom';

import { translateOrderStatus, getOrderStatusColor } from '../../utils/format';

const formatPrice = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} ₫`;

export default function OrderCard({ order, onCancel, onRetryPayment, onReturn, onDetail, onViewReturn, actionBusyId }) {
  const orderId = order.orderId ?? order.id;

  const canCancel = order?.status === 'pending';
  const canRetryPayment = order?.paymentMethod === 'vnpay' && order?.paymentStatus !== 'paid' && order?.status !== 'cancelled';
  const statusKey = (order?.status || '').toLowerCase();
  const canReturn = order?.status === 'completed' && !['refund_requested', 'return_requested', 'return_approved', 'returning', 'return_confirmed', 'returned', 'refunded', 'rejected_refund', 'rejected_return', 'recjected_refund'].includes(statusKey);
  const isRefundRequested = ['refund_requested', 'return_requested', 'return_approved', 'returning', 'return_confirmed', 'returned', 'refunded', 'rejected_refund', 'rejected_return', 'recjected_refund'].includes(statusKey);

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
            <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 font-semibold ${getOrderStatusColor(order.status)}`}>
              {translateOrderStatus(order.status)}
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
              Thanh toán ngay
            </button>
          )}

          {isRefundRequested && (
            <button 
              onClick={() => onViewReturn(orderId)}
              className="w-full border border-lumiere-gold/30 text-lumiere-gold text-[11px] tracking-[0.2em] uppercase font-medium py-3 hover:bg-lumiere-gold hover:text-white transition-all"
            >
              Xem yêu cầu trả hàng
            </button>
          )}

          {canReturn && (
            <button 
              onClick={() => onReturn(orderId)}
              disabled={actionBusyId === orderId}
              className="w-full border border-lumiere-gray/20 text-lumiere-gray text-[11px] tracking-[0.2em] uppercase font-medium py-3 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all disabled:opacity-50"
            >
              Trả hàng
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
