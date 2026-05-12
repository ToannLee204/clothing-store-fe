import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function CancelOrderModal({ show, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    onSubmit(reason);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-lumiere-charcoal/30 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-fade-up border border-lumiere-gray/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 lg:p-14 text-center">
          <div className="mb-8">
            <h3 className="serif text-4xl text-lumiere-charcoal mb-4">Hủy đơn hàng</h3>
            <div className="w-12 h-[1px] bg-rose-300 mx-auto mb-6"></div>
            <p className="text-[14px] text-lumiere-gray leading-relaxed max-w-xs mx-auto">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Vui lòng cho chúng tôi biết lý do của bạn.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            <div className="space-y-3">
              <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal flex justify-between">
                Lý do hủy đơn
                {error && <span className="text-rose-500 normal-case font-medium italic">(*)</span>}
              </label>
              <textarea
                required
                rows={5}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(''); }}
                className="w-full bg-lumiere-cream/20 border border-lumiere-gray/10 px-5 py-4 text-[15px] outline-none focus:border-rose-300 transition-all resize-none placeholder:text-lumiere-gray/40"
                placeholder="Ví dụ: Tôi muốn đổi sản phẩm khác, không còn nhu cầu..."
              />
              {error && <p className="text-[12px] text-rose-500 italic mt-1 font-medium">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-lumiere-gray text-[11px] tracking-[0.2em] uppercase font-bold py-5 border border-lumiere-gray/20 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-rose-600 text-white text-[11px] tracking-[0.2em] uppercase font-bold py-5 hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xl shadow-rose-600/20"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
