import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 1. STATE CHUẨN KHỚP 100% VỚI DATABASE
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Bảng products
  const [productData, setProductData] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    description: '',
    thumbnailUrl: '',
    status: 1, // 1: Hiển thị, 0: Ẩn
  });

  // Bảng product_variants
  const [variants, setVariants] = useState([
    { sku: '', color: '', size: '', stockQty: '', salePrice: '' }
  ]);

  // Bảng product_images
  const [images, setImages] = useState([]);

  // 2. LẤY DANH MỤC LÊN ĐỂ ĐỔ VÀO THẺ SELECT
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

  // 3. XỬ LÝ BIẾN THỂ (VARIANTS)
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
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  // 4. XỬ LÝ ẢNH PHỤ (IMAGES)
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index].imageUrl = value;
    setImages(newImages);
  };

  const addImage = () => {
    setImages([...images, { imageUrl: '', sortOrder: images.length }]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // Cập nhật lại sortOrder sau khi xóa
    const reorderedImages = newImages.map((img, i) => ({ ...img, sortOrder: i }));
    setImages(reorderedImages);
  };

  // 5. GỬI DỮ LIỆU LÊN API BE (multipart/form-data)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!productData.name || !productData.categoryId || !productData.basePrice) {
      return setError('Vui lòng điền đủ Tên, Danh mục và Giá cơ bản!');
    }

    setLoading(true);
    try {
      // Build the product JSON object matching ProductCreateRequest
      const productPayload = {
        ...productData,
        basePrice: Number(productData.basePrice),
        variants: variants.map(v => ({
          ...v,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null
        })),
        imageUrls: images.filter(img => img.imageUrl.trim() !== '').map(img => img.imageUrl)
      };

      // Backend expects multipart/form-data with @RequestPart("product")
      const formData = new FormData();
      formData.append(
        'product',
        new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
      );

      const response = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Không set Content-Type — browser tự thêm multipart/form-data + boundary
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

            {/* Box 2: Ảnh đại diện & Ảnh phụ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>Hình ảnh sản phẩm</span>
                <span className="text-xs font-medium text-slate-400">Dùng URL Link</span>
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ảnh đại diện (Thumbnail)</label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                      value={productData.thumbnailUrl}
                      onChange={(e) => setProductData({...productData, thumbnailUrl: e.target.value})}
                      placeholder="https://domain.com/image.jpg"
                    />
                  </div>
                  <div className="size-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {productData.thumbnailUrl ? (
                      <img src={productData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'}/>
                    ) : (
                      <span className="material-symbols-outlined text-slate-400">image</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bộ sưu tập ảnh phụ */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bộ sưu tập ảnh phụ (Gallery)</label>
                  <button 
                    type="button" // QUAN TRỌNG: FIX LỖI SUBMIT FORM
                    onClick={addImage}
                    className="text-[#ec5b13] font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Thêm ảnh
                  </button>
                </div>
                
                <div className="space-y-3">
                  {images.map((img, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-slate-500">#{index + 1}</div>
                      <input 
                        type="text" 
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                        placeholder="Nhập URL ảnh phụ..."
                        value={img.imageUrl}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {images.length === 0 && <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Chưa có ảnh phụ nào. Bấm "Thêm ảnh" để bổ sung.</p>}
                </div>
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
                type="button" // QUAN TRỌNG: FIX LỖI SUBMIT FORM
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