import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // State lưu trữ dữ liệu
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: '',
    status: 1,
    thumbnailUrl: ''
  });

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
            thumbnailUrl: p.thumbnailUrl || p.thumbnail_url || ''
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, token]);

  // 2. Xử lý thay đổi Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Xử lý Submit lưu thay đổi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'PUT', // Hoặc PATCH tùy BE của bạn
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Cập nhật sản phẩm thành công!');
        navigate('/admin/products');
      } else {
        const text = await response.text();
        alert('Có lỗi xảy ra: ' + text);
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#ec5b13]">progress_activity</span>
          <p className="font-medium">Đang tải dữ liệu sản phẩm...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-50 font-sans min-h-screen pb-20">
      
      {/* Header Form */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="size-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            title="Quay lại"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa sản phẩm</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ID Sản phẩm: #{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
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
               <><span className="material-symbols-outlined text-[18px]">save</span> Lưu thay đổi</>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-5xl mx-auto mt-8 px-8">
        <form id="edit-product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (Thông tin chính) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Box: Thông tin cơ bản */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Thông tin cơ bản</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                  placeholder="Viết mô tả chi tiết cho sản phẩm này..."
                ></textarea>
              </div>
            </div>

            {/* Box: Danh mục */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Phân loại</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Danh mục sản phẩm <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (Hình ảnh & Giá cả) */}
          <div className="space-y-6">
            
            {/* Box: Trạng thái */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Trạng thái hiển thị</h3>
              <div className="relative">
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all cursor-pointer font-medium"
                >
                  <option value={1}>🟢 Hoạt động (Hiển thị)</option>
                  <option value={0}>⚪ Bản nháp (Đang ẩn)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Box: Hình ảnh */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Hình ảnh đại diện</h3>
              
              {/* Image Preview */}
              <div className="w-full aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center relative group">
                {formData.thumbnailUrl ? (
                  <>
                    <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">edit</span> Thay ảnh
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <span className="material-symbols-outlined text-4xl mb-2">image</span>
                    <span className="text-sm font-medium">Chưa có hình ảnh</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đường dẫn ảnh (URL)</label>
                <input 
                  type="text" 
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-[11px] text-slate-400 mt-2 italic">* Tạm thời hỗ trợ nhập URL ảnh. Tính năng Upload File sẽ tích hợp sau.</p>
              </div>
            </div>

            {/* Box: Giá bán */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Định giá</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Giá niêm yết (VNĐ) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold text-slate-900 pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminProductEdit;