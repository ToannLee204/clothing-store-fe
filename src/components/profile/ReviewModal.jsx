import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/format';

export default function ReviewModal({ show, onClose, item, token, onSuccess }) {
  const isEdit = !!item?.review;
  const reviewData = item?.review;

  const [starRating, setStarRating] = useState(5);
  const [content, setContent] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      if (isEdit) {
        setStarRating(reviewData.starRating || 5);
        setContent(reviewData.content || '');
        setExistingImages(reviewData.imageUrls || []);
        setRemovedImageUrls([]);
        setNewImages([]);
      } else {
        setStarRating(5);
        setContent('');
        setNewImages([]);
        setExistingImages([]);
        setRemovedImageUrls([]);
      }
      setError('');
    }
  }, [show, isEdit, reviewData]);

  if (!show || !item) return null;

  const handleRemoveExisting = (url) => {
    setExistingImages(prev => prev.filter(u => u !== url));
    setRemovedImageUrls(prev => [...prev, url]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Vui lòng đăng nhập để gửi đánh giá.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('starRating', String(starRating));
      if (content) formData.append('content', content);
      
      if (newImages.length > 0) {
        newImages.forEach(img => formData.append('images', img));
      }

      let url = '/api/v1/reviews';
      let method = 'POST';

      if (isEdit) {
        url = `/api/v1/reviews/${reviewData.reviewId}`;
        method = 'PUT';
        // Thêm danh sách ảnh cần xóa
        if (removedImageUrls.length > 0) {
          removedImageUrls.forEach(imgUrl => formData.append('removeImageUrls', imgUrl));
        }
      } else {
        formData.append('orderItemId', String(item.orderItemId));
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Không thể lưu đánh giá.');
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-lumiere-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg p-8 lg:p-10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-lumiere-gray/10">
          <h3 className="serif text-2xl text-lumiere-charcoal">
            {isEdit ? 'Chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}
          </h3>
          <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex gap-4 mb-8 p-4 bg-lumiere-blush/20 border border-lumiere-gray/5">
          <div className="w-12 h-16 bg-lumiere-blush overflow-hidden shrink-0">
            {item.thumbnailUrl && <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-lumiere-charcoal truncate">{item.productName}</p>
            <p className="text-[11px] text-lumiere-gray uppercase tracking-wider">{item.color} / {item.size}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-3 block">Chất lượng sản phẩm</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarRating(star)}
                  className="group transition-transform hover:scale-110"
                >
                  <span className={`material-symbols-outlined text-3xl ${star <= starRating ? 'text-lumiere-terracotta fill-1' : 'text-lumiere-gray/30'}`}
                        style={{ fontVariationSettings: star <= starRating ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                </button>
              ))}
              <span className="ml-2 text-lumiere-gray text-[13px] font-medium self-center">
                {starRating === 5 ? 'Tuyệt vời' : starRating === 4 ? 'Hài lòng' : starRating === 3 ? 'Bình thường' : starRating === 2 ? 'Không tốt' : 'Tệ'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-3 block">Chia sẻ trải nghiệm</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Bạn nghĩ gì về sản phẩm này?"
              className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-3 block">Hình ảnh sản phẩm</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Ảnh cũ */}
              {existingImages.map((url, idx) => (
                <div key={`old-${idx}`} className="relative w-20 h-20 border border-lumiere-gray/10 group animate-fade-in">
                  <img 
                    src={getImageUrl(url)} 
                    alt="existing" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    type="button"
                    onClick={() => handleRemoveExisting(url)}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}

              {/* Ảnh mới chuẩn bị upload */}
              {newImages.map((img, idx) => (
                <div key={`new-${idx}`} className="relative w-20 h-20 border border-lumiere-charcoal/20 group animate-fade-in">
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt="preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 bg-lumiere-charcoal text-white text-[8px] px-1 uppercase">Mới</div>
                  <button 
                    type="button"
                    onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}

              <label className="w-20 h-20 border border-dashed border-lumiere-gray/30 flex flex-col items-center justify-center cursor-pointer hover:bg-lumiere-cream/30 transition-all">
                <span className="material-symbols-outlined text-lumiere-gray/60">add_a_photo</span>
                <span className="text-[10px] text-lumiere-gray/60 mt-1">Thêm ảnh</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => {
                    const files = Array.from(e.target.files);
                    setNewImages(prev => [...prev, ...files]);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {error && <p className="text-rose-600 text-[13px] serif italic">{error}</p>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium py-4 hover:bg-lumiere-terracotta transition-all disabled:opacity-50 shadow-xl shadow-lumiere-charcoal/10"
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật đánh giá' : 'Gửi đánh giá ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
