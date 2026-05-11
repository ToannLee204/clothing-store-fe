import React, { useEffect, useState } from 'react';
import ReviewModal from './ReviewModal';
import { getImageUrl, translateOrderStatus } from '../../utils/format';

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export default function OrderDetailModal({ show, onClose, orderId, token }) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
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
      
      // Also fetch my reviews to check which items are already reviewed
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

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-lumiere-charcoal/40 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-lumiere-cream w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-lumiere-gray/20 shadow-2xl animate-slide-up">
          <div className="sticky top-0 bg-lumiere-cream z-10 flex justify-between items-center p-6 lg:px-10 border-b border-lumiere-gray/10">
            <div>
              <h3 className="serif text-2xl text-lumiere-charcoal">Chi tiết đơn hàng</h3>
              {order && <p className="text-[12px] tracking-widest text-lumiere-gray uppercase mt-1">Mã: {order.orderCode}</p>}
            </div>
            <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal transition-all">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          <div className="p-6 lg:p-10">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-2 border-lumiere-terracotta border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 text-center serif italic">{error}</div>
            ) : order ? (
              <div className="grid lg:grid-cols-[1fr_300px] gap-12">
                {/* Items List */}
                <div className="space-y-8">
                  <div className="bg-white border border-lumiere-gray/15 p-6 md:p-8">
                    <h4 className="serif text-xl text-lumiere-charcoal mb-6">Sản phẩm đã mua</h4>
                    <div className="divide-y divide-lumiere-gray/10">
                      {(order.items || []).map((item, idx) => {
                        const isReviewed = !!myReviews[String(item.orderItemId)];
                        const canReview = order.status === 'completed';

                        return (
                          <div key={idx} className="py-6 flex flex-col sm:flex-row gap-6">
                            <div className="w-20 h-24 bg-lumiere-blush shrink-0 overflow-hidden">
                              {item.thumbnailUrl && <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <p className="font-semibold text-lumiere-charcoal truncate">{item.productName}</p>
                                <p className="text-[11px] text-lumiere-gray uppercase tracking-wider mt-1">
                                  Màu: {item.color || '—'} / Size: {item.size || '—'}
                                </p>
                              </div>
                              <div className="flex justify-between items-end mt-4">
                                <p className="text-[12px] text-lumiere-gray">SL: {item.quantity}</p>
                                <p className="text-[14px] font-bold text-lumiere-charcoal">{formatVND(item.lineTotal)}</p>
                              </div>
                            </div>
                            <div className="sm:w-32 flex sm:flex-col justify-end gap-2">
                              {isReviewed ? (
                                <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest text-center py-2 px-3 bg-emerald-50 border border-emerald-100">Đã đánh giá</span>
                              ) : (
                                <button
                                  disabled={!canReview}
                                  onClick={() => handleOpenReview(item)}
                                  className={`text-[11px] tracking-widest uppercase font-bold py-2 px-3 border transition-all ${
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
                    
                    <div className="mt-8 pt-6 border-t border-lumiere-gray/15 space-y-3">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-lumiere-gray">Tạm tính</span>
                        <span className="text-lumiere-charcoal font-medium">{formatVND(order.subTotal || order.total)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-lumiere-gray">Giảm giá</span>
                          <span className="text-lumiere-terracotta font-medium">-{formatVND(order.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline pt-4 border-t border-lumiere-gray/5">
                        <span className="serif text-lg text-lumiere-charcoal">Tổng thanh toán</span>
                        <span className="text-xl font-bold text-lumiere-terracotta">{formatVND(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-6">
                  <div className="bg-white border border-lumiere-gray/15 p-6">
                    <h4 className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal mb-4">Thông tin nhận hàng</h4>
                    <div className="space-y-4 text-[13px]">
                      <div>
                        <p className="text-lumiere-gray mb-1">Người nhận:</p>
                        <p className="font-semibold text-lumiere-charcoal">{order.recipientName}</p>
                      </div>
                      <div>
                        <p className="text-lumiere-gray mb-1">Số điện thoại:</p>
                        <p className="font-semibold text-lumiere-charcoal">{order.recipientPhone}</p>
                      </div>
                      <div>
                        <p className="text-lumiere-gray mb-1">Địa chỉ:</p>
                        <p className="text-lumiere-charcoal leading-relaxed">{order.addressLine}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-lumiere-gray/15 p-6">
                    <h4 className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal mb-4">Thanh toán</h4>
                    <div className="space-y-4 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-lumiere-gray">Trạng thái đơn:</span>
                        <span className="font-semibold text-lumiere-terracotta uppercase">{translateOrderStatus(order.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-lumiere-gray">Phương thức:</span>
                        <span className="font-semibold text-lumiere-charcoal uppercase">{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-lumiere-gray">Trạng thái:</span>
                        <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.status === 'shipping' && order.trackingCode && (
                    <div className="bg-lumiere-charcoal text-white p-6">
                      <h4 className="text-[11px] tracking-[0.2em] uppercase font-bold mb-2">Mã vận đơn</h4>
                      <p className="text-lg font-mono tracking-wider">{order.trackingCode}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
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
    </>
  );
}
