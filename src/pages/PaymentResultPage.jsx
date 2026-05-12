import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { formatVND } from '../utils/format';
import { authHeaders, parseResponseBody } from '../api/http';

export default function PaymentResultPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    const qs = location.search;
    if (qs) {
      verifyPayment(qs);
    } else {
      setLoading(false);
      setError('Không tìm thấy thông tin giao dịch.');
    }
  }, [location]);

  const verifyPayment = async (qs) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/payment/vnpay/return${qs}`, {
        method: 'GET',
        headers: authHeaders()
      });
      const payload = await parseResponseBody(res);
      
      if (res.ok) {
        setOrder(payload.data || payload);
      } else {
        setError(payload?.message || 'Xác nhận thanh toán thất bại.');
      }
    } catch (err) {
      console.error('Verify payment error:', err);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order?.orderId) return;
    setRetryLoading(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.orderId}/payment`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ paymentMethod: 'vnpay' }),
      });
      const payload = await parseResponseBody(res);
      if (res.ok) {
        const url = payload?.paymentUrl ?? payload?.data?.paymentUrl;
        if (url) window.location.href = url;
      } else {
        alert(payload?.message || 'Không thể khởi tạo lại thanh toán.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setRetryLoading(false);
    }
  };

  // Dựa vào dữ liệu backend trả về
  const isSuccess = order?.paymentStatus === 'paid';
  const isFailed = order?.status === 'payment_failed' || order?.paymentStatus === 'unpaid' || error;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lumiere-cream">
        <div className="w-12 h-12 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumiere-cream pt-32 pb-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white border border-lumiere-gray/10 p-8 lg:p-12 text-center shadow-2xl shadow-lumiere-charcoal/5 animate-fade-in">
          
          {isSuccess ? (
            <div className="mb-8">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-5xl font-light">check_circle</span>
              </div>
              <h1 className="serif text-3xl text-lumiere-charcoal mb-3">Thanh toán thành công</h1>
              <p className="text-lumiere-gray text-[14px]">Cảm ơn bạn đã tin tưởng và mua sắm tại CLOTHING STORE.</p>
            </div>
          ) : (
            <div className="mb-8">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-5xl font-light">error</span>
              </div>
              <h1 className="serif text-3xl text-lumiere-charcoal mb-3">Thanh toán thất bại</h1>
              <p className="text-lumiere-gray text-[14px]">
                {error || 'Đã có lỗi xảy ra trong quá trình xử lý giao dịch.'}
              </p>
            </div>
          )}

          <div className="bg-lumiere-cream/30 border border-lumiere-gray/5 p-6 mb-10 text-left space-y-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-lumiere-gray uppercase tracking-widest text-[11px] font-bold">Mã đơn hàng</span>
              <span className="text-lumiere-charcoal font-mono font-bold">{order?.orderCode || '---'}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-lumiere-gray uppercase tracking-widest text-[11px] font-bold">Tổng thanh toán</span>
              <span className="text-lumiere-charcoal font-bold">
                {formatVND(order?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-lumiere-gray uppercase tracking-widest text-[11px] font-bold">Phương thức</span>
              <span className="text-lumiere-charcoal font-medium uppercase text-[12px]">
                {order?.paymentMethod || 'VNPay'}
              </span>
            </div>
            {order?.payment?.vnpayTransactionNo && (
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-lumiere-gray uppercase tracking-widest text-[11px] font-bold">Mã giao dịch</span>
                <span className="text-lumiere-charcoal font-mono text-[11px]">{order.payment.vnpayTransactionNo}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-lumiere-gray uppercase tracking-widest text-[11px] font-bold">Trạng thái</span>
              <span className={`font-bold ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isSuccess ? 'Đã thanh toán' : 'Chưa hoàn tất'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isSuccess ? (
              <Link 
                to="/profile" 
                state={{ activeTab: 'orders' }}
                className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/10 text-center"
              >
                Xem đơn hàng của tôi
              </Link>
            ) : (
              <>
                {order && (
                  <button 
                    onClick={handleRetryPayment}
                    disabled={retryLoading}
                    className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/10 disabled:opacity-50"
                  >
                    {retryLoading ? 'Đang khởi tạo...' : 'Thanh toán lại'}
                  </button>
                )}
                <Link 
                  to="/checkout" 
                  className="bg-lumiere-cream border border-lumiere-charcoal text-lumiere-charcoal text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-charcoal hover:text-white transition-all text-center"
                >
                  Quay lại trang thanh toán
                </Link>
              </>
            )}
            
            <Link 
              to="/products" 
              className="border border-lumiere-gray/20 text-lumiere-gray text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all text-center"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[12px] text-lumiere-gray italic">
            Nếu bạn đã thanh toán nhưng đơn hàng vẫn báo thất bại, vui lòng liên hệ bộ phận hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
}
