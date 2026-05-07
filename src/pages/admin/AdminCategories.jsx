import React, { useEffect, useMemo, useState } from 'react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const token = localStorage.getItem('token');

  const flattenCategories = (categoriesTree, prefix = '') => {
    let flatList = [];

    categoriesTree.forEach((cat) => {
      flatList.push({
        ...cat,
        displayName: prefix + cat.name,
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
        headers: { Authorization: `Bearer ${token}` },
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return alert('Tên danh mục không được để trống!');

    setLoading(true);
    try {
      const url = editingId ? `/api/v1/categories/${editingId}` : '/api/v1/categories';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        parentId: formData.parentId ? formData.parentId : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      parentId: category.parentId || category.parent?.id || '',
    });
    setEditingId(category.id);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setFormData({ name: '', parentId: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      const response = await fetch(`/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  const handleToggleVisibility = async (id) => {
    try {
      const response = await fetch(`/api/v1/categories/${id}/visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert('Chưa cấu hình API đổi trạng thái ở Backend!');
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  const stats = useMemo(() => {
    const visibleCount = categories.filter((cat) => Number(cat.status) !== 0).length;
    const hiddenCount = categories.filter((cat) => Number(cat.status) === 0).length;
    const rootCount = categories.filter((cat) => !cat.parentId && !cat.parent?.id).length;

    return [
      {
        label: 'Tổng danh mục',
        value: categories.length,
        icon: 'category',
        accent: 'from-[#ec5b13] to-[#ff8a4c]',
        detail: 'Tất cả danh mục đã được đồng bộ từ hệ thống',
      },
      {
        label: 'Danh mục gốc',
        value: rootCount,
        icon: 'account_tree',
        accent: 'from-slate-600 to-slate-400',
        detail: 'Các nút cấp cao nhất trong cây phân loại',
      },
      {
        label: 'Đang hiển thị',
        value: visibleCount,
        icon: 'visibility',
        accent: 'from-emerald-500 to-emerald-400',
        detail: 'Danh mục đang mở cho người dùng',
      },
      {
        label: 'Đang ẩn',
        value: hiddenCount,
        icon: 'visibility_off',
        accent: 'from-amber-500 to-amber-400',
        detail: 'Danh mục chưa công khai hoặc đang tạm ẩn',
      },
    ];
  }, [categories]);

  const hasFormData = formData.name.trim().length > 0 || formData.parentId !== '';

  return (
    <main className="min-h-screen flex-1 overflow-auto bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ec5b13] via-[#ff8a4c] to-[#ffd0b0]" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ec5b13]/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                <span className="material-symbols-outlined text-[16px]">category</span>
                Admin / Danh mục
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Quản lý danh mục
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Giao diện được làm mới theo kiểu dashboard hiện đại, giữ nguyên tông màu của hệ thống
                nhưng tối ưu hơn cho việc phân loại, chỉnh sửa và quản lý cây danh mục.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Tổng danh mục</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{categories.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Trạng thái form</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {isFormOpen ? (editingId ? 'Đang chỉnh sửa' : 'Đang thêm mới') : 'Đang đóng'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Bộ lọc cây</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Dạng phân cấp</p>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
              <button
                onClick={() => {
                  setIsFormOpen(true);
                  setEditingId(null);
                  setFormData({ name: '', parentId: '' });
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d95210]"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Thêm danh mục mới
              </button>

              <button
                onClick={fetchCategories}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Làm mới
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg`}>
                    <span className="material-symbols-outlined text-[22px]">{stat.icon}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {isFormOpen && (
          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                  <span className="material-symbols-outlined text-[16px]">
                    {editingId ? 'edit' : 'add_circle'}
                  </span>
                  {editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                </div>
                <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900">
                  {editingId ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thiết kế form theo phong cách tối giản, rõ ràng và dễ thao tác hơn trên màn quản trị.
                </p>
              </div>

              <button
                onClick={cancelEdit}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Áo sơ mi, Váy dạ hội..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Danh mục cha <span className="font-medium normal-case tracking-normal text-slate-400">(tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    >
                      <option value="">-- Danh mục gốc (Không có cha) --</option>
                      {categories
                        .filter((c) => c.id !== editingId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.displayName || cat.name}
                          </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {hasFormData ? 'Biểu mẫu đang có dữ liệu thay đổi.' : 'Điền thông tin để tạo hoặc cập nhật danh mục.'}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">save</span>
                    )}
                    Lưu danh mục
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách danh mục</h2>
              <p className="mt-1 text-sm text-slate-500">
                Hiển thị theo dạng bảng gọn hơn để dễ quét tên và cấp cha con.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              <span className="size-2 rounded-full bg-[#ec5b13]" />
              {categories.length} mục
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200">
                  <th className="w-28 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Mã ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Thuộc danh mục
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ec5b13]/10 text-[#ec5b13]">
                          <span className="material-symbols-outlined text-[30px]">category_off</span>
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-slate-900">Chưa có danh mục nào</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Hãy tạo danh mục đầu tiên để bắt đầu tổ chức hệ thống sản phẩm.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const parentName = cat.parentId
                      ? categories.find((c) => c.id === cat.parentId)?.name
                      : cat.parent?.name || null;

                    const isHidden = Number(cat.status) === 0;
                    const statusTone = isHidden
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    const statusDot = isHidden ? 'bg-slate-400' : 'bg-emerald-500';
                    const statusText = isHidden ? 'Đã ẩn' : 'Hiển thị';

                    return (
                      <tr key={cat.id} className="group transition hover:bg-[#fdf7f3]">
                        <td className="px-6 py-5 align-middle">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600">
                            #{cat.id}
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="max-w-[320px]">
                            <div className="text-sm font-bold text-slate-900">{cat.name}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {cat.displayName !== cat.name ? `Hiển thị nhánh: ${cat.displayName}` : 'Danh mục cấp gốc hoặc cấp hiện tại'}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          {parentName ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                subdirectory_arrow_right
                              </span>
                              {parentName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                account_tree
                              </span>
                              Danh mục gốc
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 align-middle text-center">
                          <button
                            onClick={() => handleToggleVisibility(cat.id)}
                            className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition hover:brightness-95 ${statusTone}`}
                            title="Click để Ẩn/Hiện danh mục"
                          >
                            <span className={`size-2 rounded-full ${statusDot}`} />
                            {statusText}
                          </button>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(cat)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ec5b13]/15 bg-[#ec5b13]/10 px-3 py-2 text-xs font-semibold text-[#c84c10] transition hover:bg-[#ec5b13]/15"
                              title="Sửa danh mục"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              Sửa
                            </button>

                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                              title="Xóa danh mục"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Xóa
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

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
            <p className="text-sm text-slate-500">
              Tổng cộng <span className="font-bold text-slate-900">{categories.length}</span> danh mục
            </p>
            <p className="text-sm text-slate-500">
              {isFormOpen ? 'Form đang mở để thao tác' : 'Sẵn sàng cho chỉnh sửa nhanh'}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminCategories;
