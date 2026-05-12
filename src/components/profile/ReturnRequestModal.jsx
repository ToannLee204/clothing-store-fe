import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function ReturnRequestModal({
  show,
  onClose,
  onSubmit,
  loading,
  order,
}) {
  const [reason, setReason] = useState("");
  const [refundBankInfo, setRefundBankInfo] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});

  const isCod = order?.paymentMethod === "cod";

  if (!show) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("Chỉ được tải lên tối đa 5 ảnh.");
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!reason.trim()) {
      newErrors.reason = "Vui lòng nhập lý do hoàn hàng";
    }
    if (isCod && !refundBankInfo.trim()) {
      newErrors.bankInfo = "Vui lòng cung cấp thông tin ngân hàng";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ reason, images, refundBankInfo });
  };

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
        className="bg-white w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-fade-up border border-lumiere-gray/5 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 lg:p-14 text-center overflow-y-auto custom-scrollbar flex-1">
          <div className="mb-8">
            <h3 className="serif text-4xl text-lumiere-charcoal mb-4">
              Yêu cầu trả hàng
            </h3>
            <div className="w-12 h-[1px] bg-lumiere-gold mx-auto mb-6"></div>
            <p className="text-[14px] text-lumiere-gray leading-relaxed max-w-xs mx-auto">
              Vui lòng cung cấp lý do chi tiết để chúng tôi có thể xử lý yêu cầu
              của bạn nhanh chóng nhất.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            <div className="space-y-3">
              <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal flex justify-between">
                Lý do hoàn hàng
                {errors.reason && (
                  <span className="text-rose-500 normal-case font-medium italic">
                    (*)
                  </span>
                )}
              </label>
                <textarea
                required
                rows={5}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors(prev => ({ ...prev, reason: "" }));
                }}
                className="w-full bg-lumiere-cream/20 border border-lumiere-gray/10 px-5 py-4 text-[15px] outline-none focus:border-lumiere-gold transition-all resize-none placeholder:text-lumiere-gray/40"
                placeholder="Ví dụ: Sản phẩm không đúng mô tả, lỗi kỹ thuật..."
              />
              {errors.reason && (
                <p className="text-[12px] text-rose-500 italic mt-1 font-medium">
                  {errors.reason}
                </p>
              )}
            </div>

            {isCod && (
              <div className="space-y-3">
                <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal flex justify-between">
                  Thông tin ngân hàng nhận hoàn tiền
                  {errors.bankInfo && (
                    <span className="text-rose-500 normal-case font-medium italic">
                      (*)
                    </span>
                  )}
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundBankInfo}
                  onChange={(e) => {
                    setRefundBankInfo(e.target.value);
                    setErrors(prev => ({ ...prev, bankInfo: "" }));
                  }}
                  className="w-full bg-lumiere-cream/20 border border-lumiere-gray/10 px-5 py-4 text-[15px] outline-none focus:border-lumiere-gold transition-all resize-none placeholder:text-lumiere-gray/40 font-mono"
                  placeholder="Số tài khoản - Ngân hàng - Tên chủ tài khoản"
                />
                <p className="text-[11px] text-lumiere-gray italic mt-1">
                  * Dành cho đơn hàng thanh toán COD. Ví dụ: 123456789 - BIDV - Nguyễn Văn An
                </p>
                {errors.bankInfo && (
                  <p className="text-[12px] text-rose-500 italic mt-1 font-medium">
                    {errors.bankInfo}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal flex justify-between">
                Ảnh minh họa (Tối đa 5 ảnh)
                <span className="text-lumiere-gray font-medium normal-case lowercase">
                  {images.length}/5
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                {previews.map((src, index) => (
                  <div key={index} className="relative w-20 h-20 group">
                    <img
                      src={src}
                      alt="Preview"
                      className="w-full h-full object-cover border border-lumiere-gray/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        close
                      </span>
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="w-20 h-20 border border-dashed border-lumiere-gray/30 flex flex-col items-center justify-center cursor-pointer hover:bg-lumiere-cream/30 transition-all text-lumiere-gray hover:text-lumiere-charcoal">
                    <span className="material-symbols-outlined text-[20px]">
                      add_a_photo
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
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
                className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-5 hover:bg-lumiere-terracotta transition-all disabled:opacity-50 shadow-xl shadow-lumiere-charcoal/20"
              >
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
