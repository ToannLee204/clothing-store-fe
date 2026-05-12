import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from "react-dom";
import ReviewModal from './ReviewModal';
import ReturnRequestDetailModal from './ReturnRequestDetailModal';
import { getImageUrl, translateOrderStatus, formatVND } from '../../utils/format';

function resolveProductId(item) {
  if (!item || typeof item !== 'object') return '';

  const candidate = item.productId
    ?? item.product?.id
    ?? item.product?.productId
    ?? item.variant?.productId
    ?? item.orderDetail?.productId;

  return candidate != null ? String(candidate) : '';
}

export default function OrderDetailModal({ show, onClose, orderId, token }) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  // Modals State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReturnDetailModal, setShowReturnDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [myReviews, setMyReviews] = useState({});

  useEffect(() => {
    if (show && orderId) {
      fetchDetail();
    }
  }, [show, orderId]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Không thể tải chi tiết đơn hàng.');
      setOrder(payload?.data ?? payload);
      
      fetchMyReviews();
    } catch (e) {
      setError(e?.message || 'Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const res = await fetch('/api/v1/reviews/me?page=0&pageSize=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        const reviewsList = payload?.result || payload?.data?.result || [];
        const map = {};
        reviewsList.forEach(r => {
          if (r.orderItemId) map[String(r.orderItemId)] = r;
        });
        setMyReviews(map);
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenReview = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  if (!show) return null;

  const statusKey = (order?.status || '').toLowerCase();
  const isRefundRelated = ['refund_requested', 'return_requested', 'return_approved', 'returning', 'return_confirmed', 'returned', 'refunded', 'rejected_refund', 'rejected_return', 'recjected_refund'].includes(statusKey);

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 99999,
      }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-fade-up border border-lumiere-gray/5 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 lg:p-12 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-start mb-8 shrink-0">
            <div>
              <h3 className="serif text-3xl text-lumiere-charcoal mb-2">
                Chi tiết đơn hàng
              </h3>
              <div className="w-12 h-[1px] bg-lumiere-gold mb-4"></div>
              {order && <p className="text-[11px] tracking-widest text-lumiere-gray uppercase">Mã: {order.orderCode}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-lumiere-gray hover:text-lumiere-charcoal transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-lumiere-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 text-center serif italic">{error}</div>
            ) : order ? (
              <div className="space-y-12 pb-8">
                <div className="grid lg:grid-cols-[1fr_300px] gap-12">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                       <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">Sản phẩm</label>
                       {isRefundRelated && (
                        <button 
                          onClick={() => setShowReturnDetailModal(true)}
                          className="text-[10px] tracking-widest uppercase font-bold text-lumiere-gold hover:text-lumiere-charcoal transition-all border-b border-lumiere-gold/30 pb-1"
                        >
                          Xem yêu cầu trả hàng
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-lumiere-gray/10">
                      {(order.items || []).map((item, idx) => {
                        const isReviewed = !!myReviews[String(item.orderItemId)];
                        const canReview = order.status === 'completed';
                        const productId = resolveProductId(item);

                        return (
                          <div key={idx} className="py-6 flex gap-6">
                            <div 
                              onClick={() => {
                                const pid = resolveProductId(item);
                                if (pid) window.open(`/product/${pid}`, '_blank');
                              }}
                              className="w-20 h-24 bg-lumiere-blush shrink-0 overflow-hidden border border-lumiere-gray/5 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {item.thumbnailUrl && <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                              <div>
                                <Link
                                  to={`/product/${productId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block font-semibold text-lumiere-charcoal mb-1 hover:text-lumiere-terracotta transition-colors"
                                >
                                  {item.productName}
                                </Link>
                                <p className="text-[11px] text-lumiere-gray uppercase tracking-wider">{item.color} / {item.size}</p>
                              </div>
                              <div className="flex justify-between items-end">
                                <p className="text-[12px] text-lumiere-gray italic">x{item.quantity}</p>
                                <p className="text-[15px] font-bold text-lumiere-charcoal">{formatVND(item.lineTotal)}</p>
                              </div>
                            </div>
                            <div className="w-32 flex flex-col justify-center">
                              {isReviewed ? (
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest text-center py-2 bg-emerald-50 border border-emerald-100">Đã đánh giá</span>
                              ) : (
                                <button
                                  disabled={!canReview}
                                  onClick={() => handleOpenReview(item)}
                                  className={`text-[10px] tracking-widest uppercase font-bold py-2 border transition-all ${
                                    canReview 
                                      ? 'border-lumiere-charcoal text-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white' 
                                      : 'border-lumiere-gray/20 text-lumiere-gray/40 cursor-not-allowed'
                                  }`}
                                >
                                  Đánh giá
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">Thông tin nhận hàng</label>
                      <div className="text-sm space-y-1">
                        <p className="font-bold">{order.recipientName}</p>
                        <p>{order.recipientPhone}</p>
                        <p className="text-lumiere-gray leading-relaxed mt-2 italic text-[13px]">"{order.addressLine}"</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">Trạng thái đơn hàng</label>
                      <div className="text-sm space-y-3">
                        <div className="flex justify-between">
                          <span className="text-lumiere-gray">Trạng thái:</span>
                          <span className="font-bold text-lumiere-gold uppercase">{translateOrderStatus(order.status)}</span>
                        </div>
                        <div className="flex justify-between border-t border-lumiere-gray/5 pt-2">
                          <span className="text-lumiere-gray">Thanh toán:</span>
                          <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.trackingCode && (
                      <div className="p-5 bg-lumiere-charcoal text-white rounded-sm shadow-lg shadow-lumiere-charcoal/10">
                        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1 font-bold">Mã vận đơn</p>
                        <p className="font-mono font-bold tracking-wider text-base">{order.trackingCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-10 border-t border-lumiere-gray/10 flex justify-end">
                  <div className="w-full max-w-xs space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-lumiere-gray italic">Tạm tính:</span>
                      <span className="font-medium">{formatVND(order.subTotal || order.total)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-lumiere-gray italic">Giảm giá:</span>
                        <span className="text-lumiere-terracotta">-{formatVND(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-4 border-t border-lumiere-gray/10">
                      <span className="serif text-xl text-lumiere-charcoal">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-lumiere-terracotta">{formatVND(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex justify-end shrink-0 pt-4 border-t border-lumiere-gray/5">
            <button
              onClick={onClose}
              className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold px-12 py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/20"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      <ReviewModal 
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        item={selectedItem}
        token={token}
        onSuccess={fetchMyReviews}
      />

      <ReturnRequestDetailModal 
        show={showReturnDetailModal}
        onClose={() => setShowReturnDetailModal(false)}
        orderId={orderId}
        token={token}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
