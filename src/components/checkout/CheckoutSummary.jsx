import { getImageUrl } from '../../utils/format';

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export default function CheckoutSummary({ 
  items, 
  summary, 
  onPlaceOrder, 
  submitting, 
  disabled 
}) {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-10 sticky top-28">
      <h2 className="serif text-2xl text-lumiere-charcoal mb-8 pb-4 border-b border-lumiere-gray/10">Tóm tắt đơn hàng</h2>
      
      {/* Mini Item List */}
      <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="w-12 h-16 bg-lumiere-blush shrink-0 overflow-hidden">
              <img 
                src={getImageUrl(item.thumbnailUrl || item.imageUrl)} 
                alt={item.productName} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x600?text=No+Image'; }}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <p className="text-[13px] font-medium text-lumiere-charcoal truncate">{item.productName}</p>
              <div className="flex justify-between items-end">
                <p className="text-[11px] text-lumiere-gray">SL: {item.quantity}</p>
                <p className="text-[12px] font-semibold text-lumiere-charcoal">{formatVND(item.lineTotal)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-10 pt-6 border-t border-lumiere-gray/10">
        <div className="flex justify-between text-[14px]">
          <span className="text-lumiere-gray">Tạm tính</span>
          <span className="text-lumiere-charcoal font-medium">{formatVND(summary.subTotal)}</span>
        </div>
        {summary.discountAmount > 0 && (
          <div className="flex justify-between text-[14px]">
            <span className="text-lumiere-gray">Giảm giá</span>
            <span className="text-lumiere-terracotta font-medium">-{formatVND(summary.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[14px]">
          <span className="text-lumiere-gray">Phí vận chuyển</span>
          <span className="text-lumiere-charcoal font-medium">Miễn phí</span>
        </div>
        <div className="h-px bg-lumiere-gray/10 my-6" />
        <div className="flex justify-between items-baseline">
          <span className="serif text-xl text-lumiere-charcoal">Tổng thanh toán</span>
          <span className="text-[24px] font-bold text-lumiere-terracotta">{formatVND(summary.total)}</span>
        </div>
      </div>

      {summary.voucherCode && (
        <div className="mb-8 p-3 bg-lumiere-blush/30 border border-lumiere-terracotta/20 text-center">
          <span className="text-[11px] font-bold text-lumiere-terracotta uppercase tracking-widest">Đang áp voucher: {summary.voucherCode}</span>
        </div>
      )}

      <button 
        onClick={onPlaceOrder}
        disabled={disabled || submitting}
        className="w-full bg-lumiere-terracotta text-white text-[12px] tracking-[0.2em] uppercase font-medium py-4 hover:opacity-90 transition-all shadow-xl shadow-lumiere-terracotta/10 disabled:bg-lumiere-gray/40 disabled:shadow-none"
      >
        {submitting ? 'Đang xử lý...' : 'Hoàn tất đặt hàng'}
      </button>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-[11px] text-lumiere-gray">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Thanh toán bảo mật & an toàn</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-lumiere-gray">
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>Dễ dàng đổi trả trong 30 ngày</span>
        </div>
      </div>
    </div>
  );
}
