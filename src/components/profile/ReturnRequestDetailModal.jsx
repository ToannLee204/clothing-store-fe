import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getImageUrl,
  formatVND,
  translateOrderStatus,
} from "../../utils/format";

export default function ReturnRequestDetailModal({
  show,
  onClose,
  orderId,
  token,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && orderId) {
      fetchData();
    }
  }, [show, orderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/return-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (res.ok) {
        setData(payload.data || payload);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

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
    >
      <div
        className="bg-white w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-fade-up border border-lumiere-gray/5 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="serif text-3xl text-lumiere-charcoal mb-2">
                Chi tiết yêu cầu trả hàng
              </h3>
              <div className="w-12 h-[1px] bg-lumiere-gold mb-4"></div>
            </div>
            <button
              onClick={onClose}
              className="text-lumiere-gray hover:text-lumiere-charcoal transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-lumiere-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                    Thông tin chung
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-lumiere-gray">Mã đơn hàng:</span>{" "}
                      <span className="font-bold">{data.orderCode}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-lumiere-gray">
                        Ngày gửi yêu cầu:
                      </span>{" "}
                      <span>
                        {new Date(data.refundRequestDate).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-lumiere-gray">Trạng thái:</span>{" "}
                      <span className="text-lumiere-gold font-bold">
                        {translateOrderStatus(data.orderStatus)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                    Số tiền hoàn trả
                  </label>
                  <p className="text-3xl font-bold text-lumiere-terracotta">
                    {formatVND(data.refundAmount || data.orderTotal)}
                  </p>
                </div>
              </div>

              {data.refundBankInfo && (
                <div className="space-y-4">
                  <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                    Thông tin nhận hoàn tiền
                  </label>
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-sm font-mono text-emerald-800 text-sm">
                    {data.refundBankInfo}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                  Lý do của bạn
                </label>
                <div className="bg-lumiere-cream/20 border border-lumiere-gray/10 p-5 rounded-sm italic text-lumiere-charcoal leading-relaxed">
                  "{data.refundReason}"
                </div>
              </div>

              {data.imageUrls && data.imageUrls.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-gray">
                    Hình ảnh minh chứng
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {data.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(url)}
                        alt="Proof"
                        className="w-24 h-24 object-cover border border-lumiere-gray/10 hover:border-lumiere-gold transition-all cursor-pointer"
                        onClick={() => window.open(getImageUrl(url), "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {['rejected_refund', 'rejected_return', 'recjected_refund'].includes(data.orderStatus) && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-sm">
                  <div className="flex items-center gap-3 text-rose-700 mb-2">
                    <span className="material-symbols-outlined text-[20px]">
                      cancel
                    </span>
                    <span className="font-bold text-[13px] tracking-widest uppercase">
                      Yêu cầu bị từ chối
                    </span>
                  </div>
                  <p className="text-sm text-rose-600 font-bold mt-3">Lý do từ chối:</p>
                  <p className="text-sm text-rose-600/80 italic leading-relaxed">
                    "{data.refundRejectReason || 'Không có lý do cụ thể'}"
                  </p>
                </div>
              )}

              {data.refundApprovedAt && (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-sm">
                  <div className="flex items-center gap-3 text-emerald-700 mb-2">
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>
                    <span className="font-bold text-[13px] tracking-widest uppercase">
                      Yêu cầu đã được chấp nhận
                    </span>
                  </div>
                  <p className="text-sm text-emerald-600/80 mb-4">
                    Khoản tiền đã được hoàn trả vào tài khoản của bạn vào lúc{" "}
                    {new Date(data.refundApprovedAt).toLocaleString("vi-VN")}.
                  </p>
                  {data.refundTransferProofUrl && (
                    <div className="mt-4 border-t border-emerald-200 pt-4">
                      <p className="text-[11px] uppercase font-bold text-emerald-700 mb-3 tracking-widest">
                        Minh chứng hoàn tiền
                      </p>
                      <img
                        src={getImageUrl(data.refundTransferProofUrl)}
                        alt="Refund Bill"
                        className="w-full max-w-sm rounded-sm border border-emerald-200 cursor-pointer hover:opacity-90 transition-all"
                        onClick={() => window.open(getImageUrl(data.refundTransferProofUrl), "_blank")}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-lumiere-gray italic">
              Không tìm thấy thông tin yêu cầu.
            </div>
          )}

          <div className="mt-12 flex justify-end">
            <button
              onClick={onClose}
              className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold px-12 py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/20"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
