import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [productData, setProductData] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    description: '',
    status: 1,
  });

  const [variants, setVariants] = useState([
    { sku: '', color: '', size: '', stockQty: '', salePrice: '' }
  ]);

  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // { file, preview }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/v1/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await response.text();
        if (response.ok && text) {
          const actualData = JSON.parse(text);
          setCategories(actualData.data || actualData || []);
        }
      } catch (err) {
        console.error('Lỗi lấy danh mục:', err);
      }
    };
    fetchCategories();
  }, [token]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // VARIANTS
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };
  const addVariant = () => {
    setVariants([...variants, { sku: '', color: '', size: '', stockQty: '', salePrice: '' }]);
  };
  const removeVariant = (index) => {
    if (variants.length === 1) return alert('Phải có ít nhất 1 biến thể!');
    setVariants(variants.filter((_, i) => i !== index));
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

  // SUBMIT — multipart/form-data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!productData.name || !productData.categoryId || !productData.basePrice) {
      return setError('Vui lòng điền đủ Tên, Danh mục và Giá cơ bản!');
    }

    setLoading(true);
    try {
      const productPayload = {
        ...productData,
        basePrice: Number(productData.basePrice),
        variants: variants.map(v => ({
          ...v,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null
        })),
      };

      const formData = new FormData();
      formData.append(
        'product',
        new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
      );

      // Append thumbnail file nếu có
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      // Append gallery files nếu có
      if (imageFiles.length > 0) {
        imageFiles.forEach(img => {
          formData.append('images', img.file);
        });
      }

      const response = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const text = await response.text();
      let resData = {};
      try { resData = JSON.parse(text); } catch(e){}

      if (response.ok) {
        alert('Thêm sản phẩm thành công!');
        navigate('/admin/products');
      } else {
        setError(resData.message || 'Lỗi khi thêm sản phẩm từ Server');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối đến Backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-slate-50 font-sans min-h-screen pb-20">

      {/* Header Sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="size-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            title="Quay lại"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Thêm Sản phẩm mới</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Tạo sản phẩm mới cho hệ thống Lumina</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-[#d95210] transition-all shadow-lg shadow-[#ec5b13]/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
               <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Đang lưu...</>
            ) : (
               <><span className="material-symbols-outlined text-[18px]">add</span> Lưu sản phẩm</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 border border-red-100">
            <span className="material-symbols-outlined text-lg">error</span> {error}
          </div>
        )}

        <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN & ẢNH */}
          <div className="lg:col-span-2 space-y-6">

            {/* Box 1: Thông tin cơ bản */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Thông tin cơ bản</h3>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                  value={productData.name}
                  onChange={(e) => setProductData({...productData, name: e.target.value})}
                  placeholder="Vd: Áo khoác Bomber Minimalist..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Danh mục <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all cursor-pointer"
                      value={productData.categoryId}
                      onChange={(e) => setProductData({...productData, categoryId: e.target.value})}
                    >
                      <option value="" disabled>-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Giá niêm yết (VNĐ) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold text-slate-900 pr-10"
                      value={productData.basePrice}
                      onChange={(e) => setProductData({...productData, basePrice: e.target.value})}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả sản phẩm</label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all resize-none"
                  value={productData.description}
                  onChange={(e) => setProductData({...productData, description: e.target.value})}
                  placeholder="Chất liệu, kiểu dáng, xuất xứ..."
                ></textarea>
              </div>
            </div>

            {/* Box 2: Ảnh đại diện & Ảnh phụ — FILE UPLOAD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>Hình ảnh sản phẩm</span>
                <span className="text-xs font-medium text-slate-400">Tải lên từ máy tính</span>
              </h3>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ảnh đại diện (Thumbnail)</label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />
                {thumbnailPreview ? (
                  <div className="relative group w-40 h-40 rounded-xl overflow-hidden border-2 border-[#ec5b13]/30 shadow-md">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="p-2 bg-white/90 rounded-lg text-slate-700 hover:bg-white transition-colors"
                        title="Đổi ảnh"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="p-2 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                      <p className="text-[10px] text-white truncate">{thumbnailFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#ec5b13] transition-colors">cloud_upload</span>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-[#ec5b13] transition-colors">Chọn ảnh</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                  </button>
                )}
              </div>

              {/* Gallery Upload */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bộ sưu tập ảnh phụ (Gallery)</label>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-[#ec5b13] font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Thêm ảnh
                  </button>
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGallerySelect}
                />

                {imageFiles.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {imageFiles.map((img, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={img.preview} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">#{index + 1}</div>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                          <p className="text-[9px] text-white truncate">{img.file.name}</p>
                        </div>
                      </div>
                    ))}
                    {/* Nút thêm ảnh dạng ô */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-[#ec5b13]">add_photo_alternate</span>
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#ec5b13]">Thêm ảnh</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#ec5b13] transition-colors">add_photo_alternate</span>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-[#ec5b13] transition-colors">Bấm để chọn ảnh từ máy tính</span>
                    <span className="text-[10px] text-slate-400">Có thể chọn nhiều ảnh cùng lúc</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TRẠNG THÁI & BIẾN THỂ */}
          <div className="space-y-6">

            {/* Box 3: Trạng thái */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
               <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Trạng thái</h3>
               <div className="relative">
                 <select
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all cursor-pointer font-bold text-slate-700"
                    value={productData.status}
                    onChange={(e) => setProductData({...productData, status: Number(e.target.value)})}
                  >
                    <option value={1}>🟢 Kích hoạt (Hiển thị ngay)</option>
                    <option value={0}>⚪ Bản nháp (Đang ẩn)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
               </div>
            </div>

            {/* Box 4: Biến thể */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-lg text-slate-900">Biến thể (Variants)</h3>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {variants.map((variant, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md shadow-sm">Biến thể {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa biến thể"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Màu sắc</label>
                        <input type="text" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#ec5b13]" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="Trắng, Đen..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kích cỡ</label>
                        <input type="text" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#ec5b13]" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} placeholder="S, M, L..." />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mã SKU (Bắt buộc)</label>
                      <input type="text" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#ec5b13]" value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} placeholder="SKU-XXXX" required/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tồn kho</label>
                        <input type="number" min="0" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#ec5b13] font-bold" value={variant.stockQty} onChange={(e) => handleVariantChange(index, 'stockQty', e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Giá Sale</label>
                        <input type="number" min="0" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#ec5b13]" value={variant.salePrice} onChange={(e) => handleVariantChange(index, 'salePrice', e.target.value)} placeholder="Trống = ko sale" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="w-full py-3 border border-dashed border-slate-300 text-slate-600 rounded-xl text-sm font-bold hover:border-[#ec5b13] hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Thêm biến thể khác
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
};

export default AdminAddProduct;