import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, pages: 1 });
  
  // 1. STATE BỘ LỌC
  const [filters, setFilters] = useState({ categoryId: '', status: '' });
  
  const PRODUCT_API_URL = '/api/v1/admin/products'; 
  const CATEGORY_API_URL = '/api/v1/categories';
  const token = localStorage.getItem('token');

  const handleViewVariants = (productId) => {
    navigate(`/admin/products/variants/${productId}`);
  };

  // Hàm thay đổi bộ lọc -> Tự động đưa về trang 1
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Hàm xóa bộ lọc
  const clearFilters = () => {
    setFilters({ categoryId: '', status: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(CATEGORY_API_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await response.text();
      let actualData = {};
      if (text) {
        try { actualData = JSON.parse(text); } catch (e) {}
      }
      if (response.ok) {
        setCategories(actualData.data || actualData || []);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Danh mục:', err);
    }
  };

  // 2. TÍCH HỢP BỘ LỌC VÀO API FETCH
  const fetchProducts = async (page = 1) => {
    setError('');
    try {
      // Xây dựng Query Parameters động
      const queryParams = new URLSearchParams({
        page: page - 1, // BE đếm từ 0
        pageSize: pagination.pageSize || 10,
      });

      // Nếu có chọn danh mục, đẩy vào param
      if (filters.categoryId) {
        queryParams.append('categoryId', filters.categoryId);
      }
      
      // Nếu có chọn trạng thái, đẩy vào param (Lưu ý: status là số 0 nên phải check chuỗi rỗng)
      if (filters.status !== '') {
        queryParams.append('status', filters.status);
      }

      const response = await fetch(`${PRODUCT_API_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      const res = await response.json();
  
      if (response.ok && res.data) {
        const productsArray = res.data.result || [];
        const meta = res.data.meta || {};
  
        const fullProducts = await Promise.all(
          productsArray.map(async (p) => {
            try {
              const detailRes = await fetch(`${PRODUCT_API_URL}/${p.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const detailJson = await detailRes.json();
              const detail = detailJson.data;
              const variants = detail?.variants || [];
              const totalStock = variants.reduce((sum, v) => sum + (v.stockQty || 0), 0);
  
              return { ...p, variants, totalStock };
            } catch (err) {
              return { ...p, variants: [], totalStock: 0 };
            }
          })
        );
  
        setProducts(fullProducts);
        setPagination({
          current: (meta.page !== undefined ? meta.page + 1 : 1),
          pageSize: meta.pageSize || 10,
          total: meta.totals || meta.totalElements || 0,
          pages: meta.pages || meta.totalPages || 1
        });
  
      } else {
        setError(res.message || 'Lỗi truy cập dữ liệu');
      }
  
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 3. THEO DÕI SỰ THAY ĐỔI CỦA BỘ LỌC HOẶC TRANG ĐỂ GỌI API
  useEffect(() => {
    fetchProducts(pagination.current);
  }, [filters, pagination.current]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa sản phẩm này?')) return;
    try {
      const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Xóa sản phẩm thành công!');
        fetchProducts(pagination.current); 
      }
    } catch (err) {
      alert('Không thể kết nối Server để xóa.');
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      const response = await fetch(`${PRODUCT_API_URL}/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchProducts(pagination.current); 
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  return (
    <main className="flex-1 overflow-auto p-8 bg-slate-50 font-sans min-h-screen">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        
        {/* Title and Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Quản lý sản phẩm</h2>
            <p className="text-slate-500 mt-1">Danh sách tất cả sản phẩm trong kho của hệ thống.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              <span>Xuất Excel</span>
            </button>
            <button 
              onClick={() => navigate('/admin/products/add')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-[#d95210] transition-all shadow-lg shadow-[#ec5b13]/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Thêm sản phẩm mới</span>
            </button>
          </div>
        </div>

        {/* -------------------- FILTER BAR -------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Lọc Danh mục */}
            <div className="relative">
              <select 
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="appearance-none flex items-center gap-2 pl-3 pr-10 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* Lọc Trạng thái */}
            <div className="relative">
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="appearance-none flex items-center gap-2 pl-3 pr-10 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="1">Đang hiển thị</option>
                <option value="0">Đang ẩn</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
            </div>
            
            {/* Nút Xóa bộ lọc (Chỉ hiện khi có lọc) */}
            {(filters.categoryId || filters.status !== '') && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors ml-2"
              >
                <span className="material-symbols-outlined text-[16px]">close</span> Xóa lọc
              </button>
            )}

          </div>
          
          <button className="flex items-center gap-2 px-4 py-1.5 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>Lọc nâng cao</span>
          </button>
        </div>
        {/* ---------------------------------------------------- */}

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Ảnh</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá bán</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-medium">Không tìm thấy sản phẩm nào phù hợp...</td></tr>
                ) : (
                  products.map((product) => {
                    let statusColor, statusBg, statusText;
                    if (product.status === 0) {
                      statusColor = "text-slate-600"; statusBg = "bg-slate-100 border-slate-200"; statusText = "Đã ẩn";
                    } else if (product.totalStock === 0) {
                      statusColor = "text-rose-700"; statusBg = "bg-rose-50 border-rose-200"; statusText = "Hết hàng";
                    } else if (product.totalStock < 10) {
                      statusColor = "text-amber-700"; statusBg = "bg-amber-50 border-amber-200"; statusText = `Sắp hết (${product.totalStock})`;
                    } else {
                      statusColor = "text-emerald-700"; statusBg = "bg-emerald-50 border-emerald-200"; statusText = `Còn hàng (${product.totalStock})`;
                    }

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="size-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            <img 
                              className="w-full h-full object-cover" 
                              src={product.thumbnailUrl || product.thumbnail_url || 'https://placehold.co/100x140?text=No+Image'} 
                              alt={product.name}
                              onError={(e) => { e.target.src = 'https://placehold.co/100x140?text=Error'; }} 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-900 line-clamp-1">{product.name}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">layers</span>
                            {product.variants?.length || 0} Biến thể
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                          <span className="bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
                            {product.categoryName || 'Chưa phân loại'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {(product.basePrice || 0).toLocaleString()}đ
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleToggleVisibility(product.id)}
                            title="Click để Ẩn/Hiện sản phẩm"
                            className={`px-2 py-1 border rounded ${statusBg} ${statusColor} text-[11px] font-semibold hover:brightness-95 transition-all w-24 text-center`}
                          >
                            {statusText}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleViewVariants(product.id)} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-semibold"
                            >
                              <span className="material-symbols-outlined text-[16px]">style</span> Kho
                            </button>
                            <button 
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#ec5b13]/10 text-[#ec5b13] hover:bg-[#ec5b13]/20 transition-colors text-xs font-semibold"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold ml-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Đang hiển thị <span className="font-bold text-slate-900">
                {products.length > 0 ? (pagination.current - 1) * pagination.pageSize + 1 : 0}
              </span> - <span className="font-bold text-slate-900">
                {(pagination.current - 1) * pagination.pageSize + products.length}
              </span> trong số <span className="font-bold text-slate-900">
                {pagination.total}
              </span> sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination.current <= 1}
                onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                className="size-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              
              <button className="size-9 flex items-center justify-center rounded-lg bg-[#ec5b13] text-white text-sm font-bold shadow-sm shadow-[#ec5b13]/20">
                {pagination.current}
              </button>
              
              <button 
                disabled={pagination.current >= pagination.pages}
                onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                className="size-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminProducts;