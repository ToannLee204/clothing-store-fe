import React, { useState } from 'react';

export default function ReviewModal({ show, onClose, item, token, onSuccess }) {
  const [starRating, setStarRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show || !item) return null;

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
      formData.append('orderItemId', String(item.orderItemId));
      formData.append('starRating', String(starRating));
      if (content) formData.append('content', content);
      
      if (images.length > 0) {
        images.forEach(img => formData.append('images', img));
      }

      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Không thể gửi đánh giá.');
      
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
      
      <div className="relative bg-white w-full max-w-lg p-8 lg:p-10 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-lumiere-gray/10">
          <h3 className="serif text-2xl text-lumiere-charcoal">Đánh giá sản phẩm</h3>
          <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex gap-4 mb-8 p-4 bg-lumiere-blush/20 border border-lumiere-gray/5">
          <div className="w-12 h-16 bg-lumiere-blush overflow-hidden shrink-0">
            {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />}
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
            <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-3 block">Hình ảnh thực tế (nếu có)</label>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={e => setImages(Array.from(e.target.files))}
              className="text-[12px] text-lumiere-gray"
            />
          </div>

          {error && <p className="text-rose-600 text-[13px] serif italic">{error}</p>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium py-4 hover:bg-lumiere-terracotta transition-all disabled:opacity-50 shadow-xl shadow-lumiere-charcoal/10"
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
