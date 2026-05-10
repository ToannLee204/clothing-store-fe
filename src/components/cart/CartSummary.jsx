import React from 'react';

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export default function CartSummary({ 
  summary, 
  isLoggedIn, 
  voucherCodeInput, 
  setVoucherCodeInput, 
  onApplyVoucher, 
  onRemoveVoucher, 
  onCheckout,
  loading,
  checkoutDisabled 
}) {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 sticky top-28">
      <h2 className="serif text-2xl text-lumiere-charcoal mb-8 pb-4 border-b border-lumiere-gray/10">Tóm tắt đơn hàng</h2>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-[14px]">
          <span className="text-lumiere-gray">Tạm tính</span>
          <span className="text-lumiere-charcoal font-medium">{formatVND(summary.subTotal)}</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-lumiere-gray">Giảm giá</span>
          <span className="text-lumiere-terracotta font-medium">-{formatVND(summary.discountAmount)}</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-lumiere-gray">Phí vận chuyển</span>
          <span className="text-lumiere-charcoal font-medium">Miễn phí</span>
        </div>
        <div className="h-px bg-lumiere-gray/10 my-6" />
        <div className="flex justify-between items-baseline">
          <span className="serif text-xl text-lumiere-charcoal">Tổng cộng</span>
          <span className="text-[24px] font-bold text-lumiere-charcoal">{formatVND(summary.total)}</span>
        </div>
      </div>

      {/* Voucher Section */}
      <div className="mb-8">
        <div className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray mb-3">Mã giảm giá</div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={voucherCodeInput}
            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã của bạn"
            disabled={!isLoggedIn || loading}
            className="flex-1 bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[13px] outline-none focus:border-lumiere-charcoal transition-all disabled:opacity-50"
          />
          <button 
            onClick={onApplyVoucher}
            disabled={!isLoggedIn || loading || !voucherCodeInput.trim()}
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.15em] uppercase font-medium px-4 py-3 hover:bg-lumiere-terracotta transition-all disabled:bg-lumiere-gray/40"
          >
            {loading ? '...' : 'Áp dụng'}
          </button>
        </div>
        {summary.voucherCode && (
          <div className="flex items-center justify-between mt-3 px-3 py-2 bg-lumiere-blush/30 border border-lumiere-terracotta/20">
            <span className="text-[12px] font-medium text-lumiere-terracotta tracking-wide">Mã: {summary.voucherCode}</span>
            <button 
              onClick={onRemoveVoucher}
              className="text-[11px] text-lumiere-gray hover:text-lumiere-charcoal underline uppercase tracking-widest font-semibold"
            >
              Gỡ bỏ
            </button>
          </div>
        )}
        {!isLoggedIn && (
          <p className="text-[11px] text-lumiere-gray italic mt-2">* Đăng nhập để sử dụng mã giảm giá</p>
        )}
      </div>

      <button 
        onClick={onCheckout}
        disabled={checkoutDisabled}
        className="w-full bg-lumiere-terracotta text-white text-[12px] tracking-[0.2em] uppercase font-medium py-4 hover:opacity-90 transition-all shadow-xl shadow-lumiere-terracotta/10 disabled:bg-lumiere-gray/40 disabled:shadow-none mb-4"
      >
        Thanh toán ngay
      </button>

      <div className="p-4 bg-lumiere-cream/50 border border-lumiere-gray/10 text-[12px] text-lumiere-gray leading-relaxed">
        <p className="mb-2">✔️ Đổi trả trong vòng 30 ngày</p>
        <p>✔️ Thanh toán bảo mật tuyệt đối</p>
      </div>
    </div>
  );
}
