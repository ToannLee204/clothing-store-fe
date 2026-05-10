import React from 'react';

export default function CheckoutPaymentMethod({ selectedMethod, onSelect, note, onNoteChange }) {
  const methods = [
    { 
      id: 'cod', 
      label: 'Thanh toán khi nhận hàng', 
      desc: 'COD - Trả tiền mặt cho nhân viên giao hàng',
      icon: 'payments' 
    },
    { 
      id: 'vnpay', 
      label: 'Thanh toán qua VNPAY', 
      desc: 'Ví điện tử, Thẻ ATM, QR Code qua cổng VNPAY',
      icon: 'account_balance_wallet' 
    },
  ];

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-10">
      <h2 className="serif text-2xl text-lumiere-charcoal mb-8 pb-4 border-b border-lumiere-gray/10">Phương thức thanh toán</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {methods.map(method => {
          const active = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`text-left p-6 border transition-all flex gap-4 ${
                active 
                  ? 'border-lumiere-terracotta bg-lumiere-blush/20' 
                  : 'border-lumiere-gray/10 hover:border-lumiere-gray/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[28px] ${active ? 'text-lumiere-terracotta' : 'text-lumiere-gray'}`}>
                {method.icon}
              </span>
              <div>
                <p className={`font-bold text-[14px] mb-1 ${active ? 'text-lumiere-charcoal' : 'text-lumiere-gray'}`}>{method.label}</p>
                <p className="text-[11px] text-lumiere-gray leading-relaxed uppercase tracking-wider">{method.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray">Ghi chú cho đơn hàng</label>
        <textarea 
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder="VD: Gọi điện trước khi giao, giao giờ hành chính..."
          className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all resize-none"
        />
      </div>
    </div>
  );
}
