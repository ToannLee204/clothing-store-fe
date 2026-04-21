import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AdminProductVariants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Popup (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' hoặc 'edit'
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dữ liệu Form trong Popup
  const [formData, setFormData] = useState({
    color: '', size: '', sku: '', stockQty: 0, salePrice: ''
  });

  const API_URL = `/api/v1/admin/products/${id}`;
  const token = localStorage.getItem('token');

  // 1. LẤY DỮ LIỆU SẢN PHẨM & BIẾN THỂ
  const fetchVariantData = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok && res.data) {
        setProduct(res.data);
        setVariants(res.data.variants || []);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariantData();
  }, [id]);

  // 2. GỌI API CẬP NHẬT LÊN SERVER
  const updateProductToServer = async (newVariantsList) => {
    setIsSaving(true);
    try {
      // Đóng gói lại dữ liệu cũ kèm list biến thể mới
      const payload = {
        name: product.name,
        categoryId: product.category?.id,
        description: product.description,
        basePrice: product.basePrice,
        status: product.status,
        thumbnailUrl: product.thumbnailUrl,
        imageUrls: product.imageUrls || [],
        variants: newVariantsList.map(v => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null
        }))
      };

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchVariantData(); // Tải lại dữ liệu mới nhất
        setIsModalOpen(false); // Đóng Popup
      } else {
        const text = await response.text();
        alert('Lỗi khi lưu: ' + text);
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. XỬ LÝ MỞ POPUP THÊM / SỬA
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ color: '', size: '', sku: '', stockQty: 0, salePrice: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (variant, index) => {
    setModalMode('edit');
    setEditingIndex(index);
    setFormData({
      color: variant.color || '',
      size: variant.size || '',
      sku: variant.sku || '',
      stockQty: variant.stockQty || 0,
      salePrice: variant.salePrice || ''
    });
    setIsModalOpen(true);
  };

  // 4. XỬ LÝ LƯU BIẾN THỂ
  const handleSaveVariant = (e) => {
    e.preventDefault();
    if (!formData.sku.trim()) return alert("Mã SKU là bắt buộc!");

    let newVariantsList;
    if (modalMode === 'add') {
      newVariantsList = [...variants, formData];
    } else {
      newVariantsList = [...variants];
      newVariantsList[editingIndex] = formData;
    }
    
    updateProductToServer(newVariantsList);
  };

  // 5. XỬ LÝ XÓA BIẾN THỂ
  const handleDeleteVariant = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
      const newVariantsList = variants.filter((_, i) => i !== index);
      updateProductToServer(newVariantsList);
    }
  };


  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#ec5b13]">progress_activity</span>
          <p className="font-medium">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-50 font-sans min-h-screen pb-20 relative">
      
      {/* ----------------- POPUP MODAL THÊM/SỬA ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">
                {modalMode === 'add' ? 'Thêm biến thể mới' : 'Chỉnh sửa biến thể'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveVariant} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Màu sắc</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Đen, Trắng..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kích cỡ</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="S, M, L..." />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mã SKU <span className="text-red-500">*</span></label>
                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="VD: SKU-12345" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tồn kho</label>
                  <input type="number" min="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none" value={formData.stockQty} onChange={e => setFormData({...formData, stockQty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Giá Sale (Tùy chọn)</label>
                  <input type="number" min="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} placeholder="Bỏ trống nếu ko giảm" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-[#ec5b13] text-white font-bold rounded-xl hover:bg-[#d95210] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Lưu biến thể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------- */}

      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="size-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            title="Quay lại danh sách"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ec5b13]">layers</span> Biến thể sản phẩm
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-widest">{product?.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/admin/products/edit/${id}`)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span> Sửa chung
          </button>
          <button onClick={openAddModal} className="px-6 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-[#d95210] transition-all shadow-lg shadow-[#ec5b13]/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Thêm biến thể mới
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 px-8">
        
        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm flex items-center gap-6">
          <div className="size-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
             <img src={product?.thumbnailUrl || 'https://placehold.co/100x140?text=No+Img'} alt={product?.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 mb-1">{product?.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span>Giá cơ bản: <strong className="text-slate-900">{(product?.basePrice || 0).toLocaleString()}đ</strong></span>
              <span className="size-1 rounded-full bg-slate-300"></span>
              <span>Tổng số biến thể: <strong className="text-[#ec5b13]">{variants.length}</strong></span>
            </p>
          </div>
        </div>

        {/* Bảng biến thể */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Phân loại (Màu / Size)</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Mã SKU</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Giá bán / Sale</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Tồn kho</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.length === 0 ? (
                  <tr><td colSpan="6" className="py-20 text-center text-slate-500 font-medium">Sản phẩm này chưa có biến thể nào được thiết lập.</td></tr>
                ) : (
                  variants.map((v, index) => {
                    let statusColor, statusBg, statusText;
                    if (v.stockQty === 0) {
                      statusColor = "text-rose-700"; statusBg = "bg-rose-50 border-rose-200"; statusText = "Hết hàng";
                    } else if (v.stockQty < 10) {
                      statusColor = "text-amber-700"; statusBg = "bg-amber-50 border-amber-200"; statusText = "Sắp hết";
                    } else {
                      statusColor = "text-emerald-700"; statusBg = "bg-emerald-50 border-emerald-200"; statusText = "Sẵn hàng";
                    }

                    return (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-900">{v.color || "N/A"} <span className="text-slate-300 mx-1">|</span> {v.size || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-mono text-slate-600 font-semibold">
                          <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{v.sku || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="font-bold text-slate-900 text-sm">{(v.salePrice || product?.basePrice || 0).toLocaleString()}đ</div>
                           {v.salePrice && v.salePrice < product?.basePrice && (
                              <div className="text-[11px] text-slate-400 line-through mt-0.5">{(product?.basePrice || 0).toLocaleString()}đ</div>
                           )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold inline-block min-w-[36px]">{v.stockQty || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 border rounded ${statusBg} ${statusColor} text-[11px] font-semibold w-20 inline-block text-center`}>{statusText}</span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEditModal(v, index)} className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#ec5b13]/10 text-[#ec5b13] hover:bg-[#ec5b13]/20 transition-colors text-xs font-semibold">
                              <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                            </button>
                            <button onClick={() => handleDeleteVariant(index)} className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold">
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
        </div>
      </div>
    </main>
  );
};

export default AdminProductVariants;