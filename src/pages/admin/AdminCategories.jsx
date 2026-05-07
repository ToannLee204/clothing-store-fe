import React, { useEffect, useMemo, useState } from 'react';
import './AdminProducts.css';

const DEFAULT_PAGE_SIZE = 20;

const parseJsonText = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getResponseMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.error || payload?.data?.message || fallback;
};

const extractListMetaAndItems = (payload) => {
  if (!payload) return { meta: null, items: [] };

  const meta = payload.meta || payload.data?.meta || null;
  const rawItems =
    payload.result ||
    payload.data?.result ||
    payload.data?.content ||
    payload.content ||
    payload.data ||
    [];

  return { meta, items: Array.isArray(rawItems) ? rawItems : [] };
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const [keywordInput, setKeywordInput] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    status: '', // '', 'true', 'false'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    pages: 1,
  });

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

  const fetchCategories = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: String(page - 1),
        pageSize: String(pagination.pageSize || DEFAULT_PAGE_SIZE),
      });

      const keyword = (nextFilters.keyword || '').trim();
      if (keyword) queryParams.append('keyword', keyword);
      if (nextFilters.status === 'true') queryParams.append('status', 'true');
      if (nextFilters.status === 'false') queryParams.append('status', 'false');

      const response = await fetch(`/api/v1/categories?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseJsonText(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, 'Không thể tải danh mục.'));
      }

      const { meta, items } = extractListMetaAndItems(payload);
      const flatData = flattenCategories(items);
      setCategories(flatData);

      if (meta) {
        setPagination((prev) => ({
          ...prev,
          current: meta.page !== undefined ? meta.page + 1 : page,
          pageSize: meta.pageSize || prev.pageSize || DEFAULT_PAGE_SIZE,
          total: meta.totals || meta.totalElements || flatData.length,
          pages: meta.pages || meta.totalPages || 1,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: flatData.length,
          pages: 1,
        }));
      }
    } catch (err) {
      setError(err?.message || 'Lỗi lấy danh mục.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        fetchCategories(pagination.current);
      } else {
        const payloadText = await parseJsonText(response);
        alert('Lỗi từ Server: ' + getResponseMessage(payloadText, 'Không thể lưu danh mục.'));
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
        fetchCategories(pagination.current);
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
        fetchCategories(pagination.current);
      } else {
        alert('Chưa cấu hình API đổi trạng thái ở Backend!');
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const nextFilters = { ...filters, keyword: keywordInput };
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchCategories(1, nextFilters);
  };

  const handleStatusChange = (value) => {
    const nextFilters = { ...filters, status: value };
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchCategories(1, nextFilters);
  };

  const clearFilters = () => {
    const nextFilters = { keyword: '', status: '' };
    setKeywordInput('');
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchCategories(1, nextFilters);
  };

  const stats = useMemo(() => {
    const visibleCount = categories.filter((cat) => Number(cat.status) !== 0 && cat.status !== false).length;
    const hiddenCount = categories.filter((cat) => Number(cat.status) === 0 || cat.status === false).length;
    const rootCount = categories.filter((cat) => !cat.parentId && !cat.parent?.id).length;

    return [
      {
        label: 'Tổng danh mục',
        value: pagination.total || categories.length,
        icon: 'category',
        detail: 'Tất cả danh mục theo bộ lọc hiện tại',
      },
      {
        label: 'Danh mục gốc',
        value: rootCount,
        icon: 'account_tree',
        detail: 'Các nút cấp cao nhất trong cây phân loại',
      },
      {
        label: 'Đang hiển thị',
        value: visibleCount,
        icon: 'visibility',
        detail: 'Danh mục đang mở cho người dùng',
      },
      {
        label: 'Đang ẩn',
        value: hiddenCount,
        icon: 'visibility_off',
        detail: 'Danh mục chưa công khai hoặc đang tạm ẩn',
      },
    ];
  }, [categories, pagination.total]);

  const hasFormData = formData.name.trim().length > 0 || formData.parentId !== '';
  const hasFilters = filters.keyword || filters.status;
  const canPrev = pagination.current > 1;
  const canNext = pagination.current < pagination.pages;

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.38)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <section
            className="filter-bar"
            style={{
              width: '100%',
              maxWidth: '720px',
              marginBottom: 0,
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div className="filter-label">{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</div>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                  {hasFormData ? 'Biểu mẫu đang có dữ liệu thay đổi.' : 'Điền thông tin để tạo hoặc cập nhật danh mục.'}
                </div>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="page-btn"
                style={{ width: '36px', height: '36px', flexShrink: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                    Tên danh mục <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Áo sơ mi, Váy dạ hội..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                    Danh mục cha <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(tùy chọn)</span>
                  </label>
                  <select
                    className="fselect"
                    style={{ width: '100%' }}
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
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {editingId ? 'Đang cập nhật dữ liệu danh mục hiện có.' : 'Danh mục mới sẽ được thêm ngay sau khi lưu.'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-ghost" onClick={cancelEdit}>Hủy bỏ</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {loading ? 'sync' : 'save'}
                    </span>
                    Lưu danh mục
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý danh mục</div>
            <div className="pm-subtitle">
              Tìm kiếm theo tên, lọc theo trạng thái và quản lý cây danh mục theo API phân trang.
            </div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" onClick={() => fetchCategories(pagination.current)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>Làm mới
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setIsFormOpen(true);
                setEditingId(null);
                setFormData({ name: '', parentId: '' });
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>Thêm danh mục
            </button>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={stat.label} className={`stat-card ${stat.label === 'Đang ẩn' ? 'warn' : ''}`}>
              <div className={`stat-icon ${idx === 0 ? 'si-blue' : idx === 1 ? 'si-gray' : idx === 2 ? 'si-teal' : 'si-amber'}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-desc">{stat.detail}</div>
            </div>
          ))}
        </div>

        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '17px',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Tìm theo tên danh mục... (Enter để tìm)"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <select className="fselect" value={filters.status} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hiển thị</option>
              <option value="false">Đang ẩn</option>
            </select>

            {hasFilters && (
              <button className="btn-ghost" onClick={clearFilters}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>Xóa lọc
              </button>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div className="filter-counts">
            <span className="dot-count"><span className="dot dot-teal" />{categories.filter((cat) => Number(cat.status) !== 0 && cat.status !== false).length} đang hiển thị</span>
            <span className="dot-count"><span className="dot dot-gray" />{pagination.total} danh mục</span>
            {loading && (
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang tải...
              </span>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <div
            className="tbl-header"
            style={{ gridTemplateColumns: '90px minmax(0,1.5fr) minmax(0,1fr) 140px 170px' }}
          >
            <div className="th">Mã ID</div>
            <div className="th">Tên danh mục</div>
            <div className="th">Thuộc danh mục</div>
            <div className="th center">Trạng thái</div>
            <div className="th right">Thao tác</div>
          </div>

          {!loading && categories.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              Không tìm thấy danh mục phù hợp.
            </div>
          ) : (
            categories.map((cat) => {
              const parentName = cat.parentId
                ? categories.find((c) => c.id === cat.parentId)?.name
                : cat.parent?.name || null;

              const isHidden = Number(cat.status) === 0 || cat.status === false;
              const statusTone = isHidden ? 'badge-red' : 'badge-green';
              const statusText = isHidden ? 'Đã ẩn' : 'Hiển thị';

              return (
                <div
                  key={cat.id}
                  className="tbl-row"
                  style={{ gridTemplateColumns: '90px minmax(0,1.5fr) minmax(0,1fr) 140px 170px' }}
                >
                  <div>
                    <span className="badge badge-cat" style={{ fontFamily: 'monospace' }}>#{cat.id}</span>
                  </div>

                  <div>
                    <div className="prod-name">{cat.name}</div>
                    <div className="prod-meta">
                      <span className="prod-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>account_tree</span>
                        {cat.displayName !== cat.name ? cat.displayName : 'Danh mục gốc hoặc cấp hiện tại'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="badge badge-cat">{parentName || 'Danh mục gốc'}</span>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleVisibility(cat.id)}
                      className={`badge ${statusTone}`}
                      title="Click để Ẩn/Hiện danh mục"
                    >
                      <span className="dot" style={{ marginRight: '4px' }} />
                      {statusText}
                    </button>
                  </div>

                  <div>
                    <div className="act-row">
                      <button className="act-btn edit" onClick={() => handleEdit(cat)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>Sửa
                      </button>
                      <button className="act-btn del" onClick={() => handleDelete(cat.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="tbl-footer">
            <span className="footer-text">
              Trang <strong>{pagination.current}</strong> / <strong>{pagination.pages}</strong> · Tổng <strong>{pagination.total}</strong> danh mục
            </span>
            <div className="pager">
              <button
                className="page-btn"
                disabled={!canPrev}
                onClick={() => fetchCategories(pagination.current - 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              <button className="page-btn active">{pagination.current}</button>
              <button
                className="page-btn"
                disabled={!canNext}
                onClick={() => fetchCategories(pagination.current + 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminCategories;
