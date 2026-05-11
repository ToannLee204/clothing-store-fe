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
  const initialImageUrlsRef = useRef([]);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: '',
    status: 1,
    internalNotes: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('');
  
  const [imageFiles, setImageFiles] = useState([]); 
  const [existingImages, setExistingImages] = useState([]); 

  // Helper to flatten category tree
  const flattenCategories = (categoriesTree, prefix = "") => {
    let flatList = [];
    categoriesTree.forEach((cat) => {
      flatList.push({
        ...cat,
        displayName: prefix + cat.name,
      });
      if (cat.children && cat.children.length > 0) {
        flatList = flatList.concat(flattenCategories(cat.children, prefix + "— "));
      }
    });
    return flatList;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/v1/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const catText = await catRes.text();
        if (catRes.ok && catText) {
          const actualCat = JSON.parse(catText);
          const rawItems = actualCat.result || actualCat.data?.result || actualCat.data || actualCat || [];
          const flatData = flattenCategories(Array.isArray(rawItems) ? rawItems : []);
          setCategories(flatData);
        }

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
          const rawImages = p.imageUrls || p.images || p.productImages || [];
          const mappedImages = rawImages.map(img =>
            typeof img === 'string' ? { url: img } : img
          );
          setExistingImages(mappedImages);
          initialImageUrlsRef.current = mappedImages.map(img => img.url || img.imageUrl).filter(Boolean);
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

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [thumbnailPreview, imageFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    setExistingThumbnailUrl('');
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productPayload = {
        ...formData,
        basePrice: Number(formData.basePrice) || 0,
      };

      const currentUrls = existingImages.map(img => img.url || img.imageUrl).filter(Boolean);
      const removedUrls = initialImageUrlsRef.current.filter(url => !currentUrls.includes(url));

      const queryParams = new URLSearchParams();
      removedUrls.forEach(url => queryParams.append('removeImageUrls', url));
      const queryString = queryParams.toString();
      const requestUrl = queryString
        ? `/api/v1/admin/products/${id}?${queryString}`
        : `/api/v1/admin/products/${id}`;

      const submitData = new FormData();
      submitData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

      if (thumbnailFile) submitData.append('thumbnail', thumbnailFile);
      if (imageFiles.length > 0) {
        imageFiles.forEach(img => submitData.append('images', img.file));
      }

      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
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
      <main className="flex min-h-screen flex-1 items-center justify-center bg-stone-100 px-6">
        <div className="rounded-2xl border border-stone-200 bg-white px-8 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
          <p className="text-sm font-medium text-stone-500">Đang tải dữ liệu sản phẩm...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-stone-100 text-stone-800 font-sans h-screen">
      {/* Top header bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-stone-900 leading-tight tracking-tight">Chỉnh sửa sản phẩm</h1>
            <p className="text-xs text-stone-500 mt-0.5">ID: #{id} · Cập nhật thông tin chi tiết</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
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
              <><span className="material-symbols-outlined text-[18px]">save</span> Lưu thay đổi</>
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
      <div className="mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT — main column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Thông tin cơ bản */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Thông tin cơ bản</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Tên sản phẩm</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all outline-none focus:border-stone-900"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Danh mục</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white transition-all cursor-pointer outline-none focus:border-stone-900 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a8a29e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.displayName || cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Giá niêm yết (VNĐ)</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white outline-none focus:border-stone-900"
                      type="text"
                      value={formData.basePrice ? Number(formData.basePrice).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, basePrice: rawValue });
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold">đ</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Mô tả chi tiết</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white transition-all resize-none leading-relaxed outline-none focus:border-stone-900"
                  rows="6"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </section>

          {/* Hình ảnh */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">gallery_thumbnail</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Hình ảnh sản phẩm</h2>
            </div>

            <div className="mb-8">
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Ảnh đại diện hiện tại</label>
              <div className="flex gap-6 items-start">
                {(thumbnailPreview || existingThumbnailUrl) ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-stone-200 group shadow-md">
                    <img src={getImageUrl(thumbnailPreview || existingThumbnailUrl)} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={removeThumbnail} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hover:bg-red-500 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="upload-zone cursor-pointer w-32 h-32 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 transition-all bg-stone-50 hover:bg-stone-100 hover:border-stone-300 group">
                    <input type="file" className="hidden" accept="image/*" ref={thumbnailInputRef} onChange={handleThumbnailSelect} />
                    <span className="material-symbols-outlined text-stone-300 group-hover:text-stone-400 text-[32px]">add_a_photo</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Thay đổi</span>
                  </label>
                )}
                <div className="flex-1 text-xs text-stone-400 leading-relaxed pt-2">
                  <p className="font-bold text-stone-700 mb-1">Ảnh đại diện</p>
                  <p>Bấm vào ảnh để xóa và chọn ảnh mới. Ảnh này sẽ xuất hiện ở danh sách sản phẩm ngoài trang chủ.</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">Bộ sưu tập ảnh chi tiết</label>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="text-[11px] font-bold text-stone-900 hover:text-stone-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Thêm ảnh mới
                </button>
              </div>

              <input type="file" className="hidden" accept="image/*" multiple ref={galleryInputRef} onChange={handleGallerySelect} />

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {existingImages.map((img, idx) => (
                  <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group shadow-sm">
                    <img src={getImageUrl(img.url || img.imageUrl)} alt="Gallery" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeExistingImage(idx)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white hover:bg-red-500 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {imageFiles.map((img, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-stone-300 ring-2 ring-emerald-100 group shadow-sm">
                    <img src={img.preview} alt="New" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeGalleryImage(idx)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white hover:bg-red-500 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 bg-emerald-500 text-[8px] text-white px-1 rounded uppercase font-bold">Mới</div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-300 transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
              </div>
            </div>
          </section>

          {/* Ghi chú nội bộ */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Ghi chú nội bộ</h2>
            </div>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none outline-none focus:border-stone-900 leading-relaxed"
              rows="3"
              placeholder="Ghi chú riêng cho nhân viên quản lý, không hiển thị cho khách hàng..."
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
            ></textarea>
          </section>
        </div>

        {/* RIGHT — sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Trạng thái hiển thị</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-800 cursor-pointer appearance-none outline-none focus:border-stone-900 transition-all"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value={1}>Hoạt động (Hiển thị)</option>
                  <option value={0}>Nháp (Ẩn)</option>
                </select>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${Number(formData.status) === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-stone-300'}`}></span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 pointer-events-none">expand_more</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed px-1 italic">Thay đổi trạng thái sẽ ảnh hưởng trực tiếp đến khách hàng trên website.</p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[20px]">inventory</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Quản lý kho</h2>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-stone-500 leading-relaxed">Để thay đổi số lượng tồn kho, màu sắc hoặc mã SKU của các biến thể, vui lòng chuyển sang trang quản lý biến thể.</p>
              <button 
                type="button"
                onClick={() => navigate(`/admin/products/variants/${id}`)}
                className="w-full py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 transition-all font-bold text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                Quản lý biến thể (Variants)
              </button>
            </div>
          </section>

          <div className="p-2 border border-stone-200 rounded-2xl border-dashed">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminProductEdit;
