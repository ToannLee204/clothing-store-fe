import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminAddProduct.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `http://localhost:8080/api/v1${url}`;
  return `http://localhost:8080/api/v1/uploads/products/${url}`;
};

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // State lưu trữ dữ liệu
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: '',
    status: 1,
  });

  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('');
  
  const [imageFiles, setImageFiles] = useState([]); // { file, preview }
  const [existingImages, setExistingImages] = useState([]); // [{id, url}]

  // 1. Fetch danh mục & Dữ liệu sản phẩm cũ
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh mục
        const catRes = await fetch('/api/v1/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const catText = await catRes.text();
        if (catRes.ok && catText) {
          const actualCat = JSON.parse(catText);
          setCategories(actualCat.data || actualCat || []);
        }

        // Lấy chi tiết sản phẩm cần sửa
        const prodRes = await fetch(`/api/v1/admin/products/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const prodJson = await prodRes.json();
        
        if (prodRes.ok && prodJson.data) {
          const p = prodJson.data;
          setFormData({
            name: p.name || '',
            description: p.description || '',
            categoryId: p.categoryId || p.category?.id || '',
            basePrice: p.basePrice || '',
            status: p.status !== undefined ? p.status : 1,
          });
          setExistingThumbnailUrl(p.thumbnailUrl || p.thumbnail_url || '');
          // API trả về imageUrls là mảng string, map sang object {url} để render
          const rawImages = p.imageUrls || p.images || p.productImages || [];
          const mappedImages = rawImages.map(img =>
            typeof img === 'string' ? { url: img } : img
          );
          setExistingImages(mappedImages);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        setError('Lỗi tải dữ liệu sản phẩm!');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, token]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [thumbnailPreview, imageFiles]);

  // 2. Xử lý thay đổi Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // THUMBNAIL FILE
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };
  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setExistingThumbnailUrl(''); // Xóa luôn ảnh cũ nếu ấn xóa
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  // GALLERY FILES
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImageFiles(prev => [...prev, ...newImages]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };
  const removeGalleryImage = (index) => {
    setImageFiles(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };
  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Xử lý Submit lưu thay đổi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productPayload = {
        ...formData,
        basePrice: Number(formData.basePrice) || 0,
        // Giả sử mảng ảnh hiện có cần gửi kèm ID để giữ lại
        retainedImageIds: existingImages.map(img => img.id).filter(id => id),
      };

      const submitData = new FormData();
      submitData.append(
        'product',
        new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
      );

      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      } else if (!existingThumbnailUrl) {
        // Gửi cờ xóa thumbnail nếu API hỗ trợ
        submitData.append('removeThumbnail', 'true');
      }

      if (imageFiles.length > 0) {
        imageFiles.forEach(img => {
          submitData.append('images', img.file);
        });
      }

      const response = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (response.ok) {
        alert('Cập nhật sản phẩm thành công!');
        navigate('/admin/products');
      } else {
        const text = await response.text();
        setError('Có lỗi xảy ra: ' + text);
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-stone-100 font-sans">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <span className="material-symbols-outlined animate-spin text-4xl text-stone-500">progress_activity</span>
          <p className="font-medium">Đang tải dữ liệu sản phẩm...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-stone-100 text-stone-800 font-sans">
      {/* Top header bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-stone-900 leading-tight tracking-tight">Chỉnh sửa sản phẩm</h1>
            <p className="text-xs text-stone-400 mt-0.5">ID Sản phẩm: #{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-colors font-medium"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Đang lưu...</>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-100">
            <span className="material-symbols-outlined text-lg">error</span> {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT — main column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Thông tin cơ bản */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">Thông tin cơ bản</h2>
            </div>

            <div className="space-y-4">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                  Tên sản phẩm <span className="text-red-400">*</span>
                </label>
                <input
                  className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all"
                  type="text"
                  name="name"
                  placeholder="Vd: Áo khoác Bomber Minimalist..."
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Danh mục + Giá */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                    Danh mục <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white transition-all cursor-pointer"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                    Giá niêm yết (VNĐ) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="field-input w-full px-3.5 py-2.5 pr-8 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all"
                      type="text"
                      placeholder="0"
                      value={formData.basePrice ? Number(formData.basePrice).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setFormData({
                          ...formData,
                          basePrice: rawValue,
                        });
                      }}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-600 pointer-events-none font-medium">đ</span>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1.5">Mô tả sản phẩm</label>
                <textarea
                  className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none leading-relaxed"
                  rows="6"
                  name="description"
                  placeholder="Chất liệu, kiểu dáng, xuất xứ..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
                <p className="text-xs text-stone-400 mt-1.5">Mô tả chi tiết giúp khách hàng ra quyết định mua hàng dễ hơn.</p>
              </div>
            </div>
          </section>

          {/* Hình ảnh sản phẩm (Upload File) */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <h2 className="text-sm font-semibold text-stone-800">Hình ảnh sản phẩm</h2>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2.5">Ảnh đại diện (Thumbnail) <span className="text-red-400">*</span></label>
              <div className="flex gap-4 items-start">
                
                {!(thumbnailPreview || existingThumbnailUrl) ? (
                  <label className="upload-zone cursor-pointer w-28 h-28 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 transition-all bg-stone-50">
                    <input type="file" className="hidden" accept="image/*" ref={thumbnailInputRef} onChange={handleThumbnailSelect} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="text-xs font-medium text-stone-500">Chọn ảnh</span>
                    <span className="text-[10px] text-stone-400">JPG, PNG, WEBP</span>
                  </label>
                ) : (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-200 group">
                    <img src={getImageUrl(thumbnailPreview || existingThumbnailUrl)} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={removeThumbnail} className="text-white hover:text-red-400 p-2">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 text-xs text-stone-500 leading-relaxed pt-1">
                  <p className="font-medium text-stone-600 mb-1">Ảnh đại diện sản phẩm</p>
                  <p>Kích thước khuyến nghị: <span className="font-medium text-stone-800">800 × 800px</span></p>
                  <p>Dung lượng tối đa: <span className="font-medium text-stone-800">5 MB</span></p>
                  <p className="mt-1.5 text-stone-400">Ảnh chất lượng cao giúp tăng tỉ lệ chuyển đổi.</p>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest">Bộ sưu tập ảnh phụ (Gallery)</label>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Thêm ảnh
                </button>
              </div>

              {(imageFiles.length === 0 && existingImages.length === 0) ? (
                <label className="upload-zone cursor-pointer w-full rounded-xl border-2 border-dashed border-stone-200 py-7 flex flex-col items-center gap-2 transition-all bg-stone-50">
                  <input type="file" className="hidden" accept="image/*" multiple ref={galleryInputRef} onChange={handleGallerySelect} />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="text-sm font-medium text-stone-500">Bấm để chọn ảnh từ máy tính</span>
                  <span className="text-xs text-stone-400">Có thể chọn nhiều ảnh cùng lúc</span>
                </label>
              ) : (
                <div>
                  <input type="file" className="hidden" accept="image/*" multiple ref={galleryInputRef} onChange={handleGallerySelect} />
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {existingImages.map((img, idx) => (
                      <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                        <img src={getImageUrl(img.url || img.imageUrl)} alt={`Existing Gallery ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeExistingImage(idx)} className="text-white hover:text-red-400 p-2">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {imageFiles.map((img, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                        <img src={img.preview} alt={`New Gallery ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeGalleryImage(idx)} className="text-white hover:text-red-400 p-2">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-500 hover:text-brand-500 hover:bg-brand-50 hover:border-brand-300 transition-all cursor-pointer"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="text-[10px] mt-1 font-medium">Thêm ảnh</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT — sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Trạng thái */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">Trạng thái</h2>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 pointer-events-none z-10"></span>
              <select 
                className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-800 cursor-pointer appearance-none transition-all hover:border-green-300"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%233b6d11' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center"
                }}
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value={1}>Hoạt động (Hiển thị ngay)</option>
                <option value={0}>Nháp (Ẩn khỏi cửa hàng)</option>
              </select>
            </div>
            <p className="text-xs text-stone-500 mt-2.5 leading-relaxed">Thay đổi trạng thái sẽ cập nhật hiển thị của sản phẩm đối với khách hàng.</p>
          </section>

          {/* Ghi chú */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">Thông tin phụ</h2>
            </div>
            <div className="text-xs text-stone-500 leading-relaxed space-y-2">
              <p>Biến thể của sản phẩm (số lượng, kho, kích cỡ) được chỉnh sửa ở mục Quản lý Biến thể riêng biệt để tránh rủi ro thao tác.</p>
              <button 
                type="button"
                onClick={() => navigate(`/admin/products/variants/${id}`)}
                className="mt-2 w-full py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all font-medium flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">style</span> Quản lý kho / Biến thể
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

export default AdminProductEdit;
