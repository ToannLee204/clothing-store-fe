import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseResponseBody, jsonAuthHeaders } from '../../api/http';
import { getImageUrl, formatPrice } from '../../utils/format';
import './AdminAddProduct.css'; // Reusing styles for consistency

const AdminProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProductDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/products/${id}`, {
        headers: jsonAuthHeaders()
      });
      const res = await parseResponseBody(response);
      if (response.ok && res.data) {
        setProduct(res.data);
      } else {
        setError(res.message || 'Không thể lấy chi tiết sản phẩm.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50 h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500 font-medium">Đang tải chi tiết sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 p-8 bg-stone-50 h-screen">
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-3xl border border-red-100 text-center shadow-xl shadow-red-500/5">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-stone-500 mb-8">{error || 'Không tìm thấy sản phẩm.'}</p>
          <button 
            onClick={() => navigate('/admin/products')}
            className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const isVisible = Number(product.status) !== 0;

  return (
    <main className="flex-1 bg-stone-50 h-screen overflow-y-auto font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/admin/products')}
              className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-stone-900">{product.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isVisible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                </span>
              </div>
              <p className="text-stone-400 font-medium mt-1">ID: <span className="font-mono">{product.id}</span> • Danh mục: <span className="text-stone-900">{product.category?.name || 'N/A'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl font-bold text-sm hover:bg-stone-50 transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa
            </button>
            <button 
              onClick={() => navigate(`/admin/products/variants/${product.id}`)}
              className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Quản lý kho
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Info Card */}
            <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50">
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-3">
                  <span className="material-symbols-outlined text-stone-400">info</span>
                  Thông tin cơ bản
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-12 mb-8">
                   <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Giá niêm yết (Base Price)</p>
                      <p className="text-3xl font-bold text-stone-900">{formatPrice(product.basePrice)}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Danh mục hệ thống</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl">
                         <span className="material-symbols-outlined text-[18px] text-stone-500">category</span>
                         <span className="text-sm font-bold text-stone-700">{product.category?.name || 'Chưa phân loại'}</span>
                      </div>
                   </div>
                </div>
                
                <div>
                   <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Mô tả sản phẩm</p>
                   <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {product.description || 'Không có mô tả cho sản phẩm này.'}
                   </div>
                </div>
              </div>
            </section>

            {/* Gallery Section */}
            <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-3">
                  <span className="material-symbols-outlined text-stone-400">imagesmode</span>
                  Thư viện hình ảnh
                </h2>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{product.imageUrls?.length || 0} ảnh</span>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {product.imageUrls?.map((url, idx) => (
                    <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden border border-stone-100 group relative">
                      <img 
                        src={getImageUrl(url)} 
                        alt={`${product.name} gallery ${idx}`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x600?text=Error'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    </div>
                  ))}
                  {(!product.imageUrls || product.imageUrls.length === 0) && (
                    <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                       <span className="material-symbols-outlined text-stone-300 text-5xl mb-2">image_not_supported</span>
                       <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Không có ảnh thư viện</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* Thumbnail Card */}
            <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ảnh đại diện (Thumbnail)</p>
              </div>
              <div className="p-6 text-center">
                <div className="aspect-[3/4] max-w-[240px] mx-auto rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
                  <img 
                    src={getImageUrl(product.thumbnailUrl)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x600?text=No+Thumbnail'; }}
                  />
                </div>
              </div>
            </section>

            {/* Quick Stats Sidebar */}
            <section className="bg-stone-900 rounded-3xl p-8 text-white shadow-xl shadow-stone-200">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                     <span className="material-symbols-outlined text-emerald-400">analytics</span>
                  </div>
                  <div>
                     <h3 className="font-bold text-white leading-none">Thống kê kho</h3>
                     <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Dữ liệu biến thể</p>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-white/60">Tổng biến thể</span>
                     <span className="text-xl font-bold">{product.variants?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-white/60">Tổng tồn kho</span>
                     <span className="text-xl font-bold">
                        {product.variants?.reduce((sum, v) => sum + (v.stockQty || 0), 0) || 0}
                     </span>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                           <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Màu sắc</p>
                           <p className="text-sm font-bold">{[...new Set(product.variants?.map(v => v.color))].length} loại</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                           <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Kích cỡ</p>
                           <p className="text-sm font-bold">{[...new Set(product.variants?.map(v => v.size))].length} size</p>
                        </div>
                     </div>
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* Variants Table Section */}
        <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden pb-12">
           <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-3">
                 <span className="material-symbols-outlined text-stone-400">list_alt</span>
                 Danh sách các phiên bản (Variants)
              </h2>
              <button 
                onClick={() => navigate(`/admin/products/variants/${product.id}`)}
                className="text-xs font-bold text-stone-900 underline uppercase tracking-widest"
              >
                Chỉnh sửa kho
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-stone-50/30">
                       <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">SKU / Mã</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Phân loại</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Tồn kho</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Giá nhập</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Giá bán</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-50">
                    {product.variants?.map((v) => (
                       <tr key={v.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-8 py-4">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-stone-900 font-mono tracking-tight">{v.sku}</span>
                                <span className="text-[10px] text-stone-400 uppercase mt-0.5">ID: {v.id?.substring(0,8)}...</span>
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-bold text-stone-700">{v.color}</span>
                                <span className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-bold text-stone-700">{v.size}</span>
                             </div>
                          </td>
                          <td className="px-8 py-4 text-center">
                             <span className={`text-sm font-bold ${v.stockQty === 0 ? 'text-red-500' : v.stockQty < 10 ? 'text-amber-500' : 'text-stone-900'}`}>
                                {v.stockQty}
                             </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="text-xs font-medium text-stone-400 line-through mr-2">
                                {v.importPrice ? formatPrice(v.importPrice) : '-'}
                             </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="text-sm font-bold text-emerald-600">{formatPrice(v.salePrice || product.basePrice)}</span>
                          </td>
                       </tr>
                    ))}
                    {(!product.variants || product.variants.length === 0) && (
                       <tr>
                          <td colSpan="5" className="px-8 py-16 text-center text-stone-400 italic">Sản phẩm này chưa được tạo biến thể.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </section>

      </div>
    </main>
  );
};

export default AdminProductDetail;
