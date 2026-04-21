import React, { useState, useEffect } from 'react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State điều khiển Form (Đã thêm parentId)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const token = localStorage.getItem('token');

  // 1. LẤY DANH SÁCH DANH MỤC
  const flattenCategories = (categoriesTree, prefix = '') => {
    let flatList = [];
    categoriesTree.forEach(cat => {
      flatList.push({ 
        ...cat, 
        displayName: prefix + cat.name 
      });
      
      if (cat.children && cat.children.length > 0) {
        flatList = flatList.concat(flattenCategories(cat.children, prefix + '— '));
      }
    });
    return flatList;
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await response.text();
      if (response.ok && text) {
        const actualData = JSON.parse(text);
        const rawData = actualData.data || actualData || [];
        const flatData = flattenCategories(rawData);
        setCategories(flatData);
      }
    } catch (err) {
      console.error('Lỗi lấy danh mục:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. THÊM HOẶC CẬP NHẬT DANH MỤC
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Tên danh mục không được để trống!');
    
    setLoading(true);
    try {
      const url = editingId ? `/api/v1/categories/${editingId}` : '/api/v1/categories';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        parentId: formData.parentId ? formData.parentId : null // Nếu rỗng thì gửi null
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        cancelEdit();
        fetchCategories();
      } else {
        const text = await response.text();
        alert('Lỗi từ Server: ' + text);
      }
    } catch (err) {
      alert('Lỗi kết nối đến Server!');
    } finally {
      setLoading(false);
    }
  };

  // 3. CHUẨN BỊ SỬA DANH MỤC
  const handleEdit = (category) => {
    setFormData({ 
      name: category.name, 
      parentId: category.parentId || category.parent?.id || '' 
    });
    setEditingId(category.id);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setFormData({ name: '', parentId: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  // 4. XÓA DANH MỤC
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      const response = await fetch(`/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert('Không thể xóa. Có thể danh mục này đang chứa danh mục con hoặc sản phẩm!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. ẨN/HIỆN DANH MỤC (Tương tự sản phẩm)
  const handleToggleVisibility = async (id) => {
    try {
      // Gọi API Toggle trạng thái (Cần BE hỗ trợ route này)
      const response = await fetch(`/api/v1/categories/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchCategories(); 
      } else {
        alert("Chưa cấu hình API đổi trạng thái ở Backend!");
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  return (
    <main className="flex-1 overflow-auto p-8 bg-slate-50 font-sans min-h-screen">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        
        {/* Title and Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Danh mục</h2>
            <p className="text-slate-500 mt-1">Phân loại và tổ chức cây danh mục hệ thống.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setIsFormOpen(true); setEditingId(null); setFormData({ name: '', parentId: '' }); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-[#d95210] transition-all shadow-lg shadow-[#ec5b13]/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Thêm danh mục mới</span>
            </button>
          </div>
        </div>

        {/* ----------------- FORM THÊM/SỬA ----------------- */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in-down">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ec5b13]">{editingId ? 'edit' : 'add_circle'}</span>
                {editingId ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
              </h3>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cột 1: Tên danh mục */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all text-slate-900 font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Áo sơ mi, Váy dạ hội..."
                  />
                </div>

                {/* Cột 2: Chọn Danh mục cha (MỚI THÊM) */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Thuộc danh mục (Tùy chọn)
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all cursor-pointer font-medium text-slate-700"
                      value={formData.parentId}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                    >
                      <option value="">-- Danh mục gốc (Không có cha) --</option>
                      {/* Lọc để không cho phép danh mục tự chọn chính nó làm cha */}
                      {categories.filter(c => c.id !== editingId).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Hàng nút bấm */}
              <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={cancelEdit} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-[#d95210] transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#ec5b13]/20">
                  {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        )}
        {/* ------------------------------------------------- */}

        {/* Bảng Danh mục */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-24">Mã ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tên danh mục</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Thuộc danh mục</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">Chưa có danh mục nào trong hệ thống.</td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    // Xử lý hiển thị Tên Danh mục cha
                    const parentName = cat.parentId 
                      ? categories.find(c => c.id === cat.parentId)?.name 
                      : (cat.parent?.name || null);

                    // Xử lý màu sắc Trạng thái (Giống trang Product)
                    let statusColor, statusBg, statusText;
                    if (cat.status === 0) {
                      statusColor = "text-slate-600"; statusBg = "bg-slate-100 border-slate-200"; statusText = "Đã ẩn";
                    } else {
                      statusColor = "text-emerald-700"; statusBg = "bg-emerald-50 border-emerald-200"; statusText = "Hiển thị";
                    }

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 font-mono text-sm text-slate-500 font-semibold bg-slate-50/50 text-center">
                          #{cat.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-slate-900">
                          {cat.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {parentName ? (
                             <span className="flex items-center gap-1">
                               <span className="material-symbols-outlined text-[16px] text-slate-400">subdirectory_arrow_right</span>
                               {parentName}
                             </span>
                          ) : (
                             <span className="text-slate-400 italic">Danh mục gốc</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleEdit(cat)} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#ec5b13]/10 text-[#ec5b13] hover:bg-[#ec5b13]/20 transition-colors text-xs font-semibold"
                              title="Sửa danh mục"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                            </button>
                            <button 
                              onClick={() => handleDelete(cat.id)} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold"
                              title="Xóa danh mục"
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
          
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Tổng cộng <span className="font-bold text-slate-900">{categories.length}</span> danh mục
            </p>
          </div>
        </div>
        
      </div>
    </main>
  );
};

export default AdminCategories;