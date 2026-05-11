import React, { useCallback, useEffect, useMemo, useState } from 'react';

const priceFormatter = new Intl.NumberFormat('vi-VN');
const formatPriceDisplay = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return priceFormatter.format(Number(digits));
};
const parsePriceRaw = (formatted) => String(formatted).replace(/\D/g, '');
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `${currencyFormatter.format(numericValue)}đ`;
};

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `http://localhost:8080/api/v1${url}`;
  return `http://localhost:8080/api/v1/uploads/products/${url}`;
};

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A→Z' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, pages: 1 });

  // Tất cả filter theo ProductFilterRequest
  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    sortBy: '',
  });

  // Keyword input state (chỉ cập nhật khi gõ, chưa call API)
  const [keywordInput, setKeywordInput] = useState('');

  // Advanced filter input state (lazy — chỉ apply khi bấm Lọc)
  const [advancedInput, setAdvancedInput] = useState({
    minPrice: '',
    maxPrice: '',
  });

  const PRODUCT_API_URL = '/api/v1/admin/products';
  const CATEGORY_API_URL = '/api/v1/categories';
  const token = localStorage.getItem('token');

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Chỉ gõ, không call API
  const handleKeywordChange = (e) => {
    setKeywordInput(e.target.value);
  };

  // Commit keyword vào filter → trigger API
  const handleKeywordSearch = () => {
    setFilters((prev) => ({ ...prev, keyword: keywordInput }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') handleKeywordSearch();
  };

  const clearFilters = () => {
    setKeywordInput('');
    setAdvancedInput({ minPrice: '', maxPrice: '' });
    setFilters({ keyword: '', categoryId: '', status: '', minPrice: '', maxPrice: '', sortBy: '' });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setShowAdvanced(false);
  };

  // Commit advanced inputs vào filters → trigger API
  const handleAdvancedApply = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: parsePriceRaw(advancedInput.minPrice),
      maxPrice: parsePriceRaw(advancedInput.maxPrice),
    }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(CATEGORY_API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      if (res.ok && text) {
        const json = JSON.parse(text);
        setCategories(json.data || json || []);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Danh mục:', err);
    }
  };

  const fetchProducts = useCallback(async (page = 1) => {
    setError('');
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        pageSize: pagination.pageSize || 10,
      });

      if (filters.keyword)    queryParams.append('keyword', filters.keyword);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.status !== '') queryParams.append('status', filters.status);
      if (filters.minPrice)   queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice)   queryParams.append('maxPrice', filters.maxPrice);
      if (filters.sortBy)     queryParams.append('sortBy', filters.sortBy);

      const response = await fetch(`${PRODUCT_API_URL}?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await response.json();

      if (response.ok && res.data) {
        const productsArray = res.data.result || [];
        const meta = res.data.meta || {};

        const fullProducts = await Promise.all(
          productsArray.map(async (p) => {
            try {
              const detailRes = await fetch(`${PRODUCT_API_URL}/${p.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const detailJson = await detailRes.json();
              const detail = detailJson.data;
              const variants = detail?.variants || [];
              const totalStock = variants.reduce((sum, v) => sum + (v.stockQty || 0), 0);
              return { ...p, variants, totalStock };
            } catch {
              return { ...p, variants: [], totalStock: 0 };
            }
          })
        );

        setProducts(fullProducts);
        setPagination((prev) => ({
          ...prev,
          current: meta.page !== undefined ? meta.page + 1 : 1,
          pageSize: meta.pageSize || 10,
          total: meta.totals || meta.totalElements || 0,
          pages: meta.pages || meta.totalPages || 1,
        }));
      } else {
        setError(res.message || 'Lỗi truy cập dữ liệu');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize, token]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(pagination.current); }, [filters, pagination.current]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa sản phẩm này?')) return;
    try {
      const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Xóa sản phẩm thành công!');
        fetchProducts(pagination.current);
      }
    } catch {
      alert('Không thể kết nối Server để xóa.');
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      const response = await fetch(`${PRODUCT_API_URL}/${id}/visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchProducts(pagination.current);
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${PRODUCT_API_URL}/import/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import_san_pham_mau.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Không thể tải file mẫu.');
      }
    } catch (err) {
      console.error('Lỗi tải template:', err);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportLoading(true);
    setImportResult(null);
    try {
      const response = await fetch(`${PRODUCT_API_URL}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const res = await response.json();
      if (response.ok) {
        setImportResult(res.data || res);
        fetchProducts(pagination.current);
      } else {
        alert(res.message || 'Lỗi khi import sản phẩm.');
      }
    } catch (err) {
      console.error('Lỗi import:', err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setImportLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const stats = useMemo(() => {
    const visibleCount = products.filter((p) => Number(p.status) !== 0).length;
    const hiddenCount = products.filter((p) => Number(p.status) === 0).length;
    const lowStockCount = products.filter((p) => {
      const isVisible = Number(p.status) !== 0;
      return isVisible && (Number(p.totalStock) || 0) < 10;
    }).length;
    return [
      { label: 'Tổng sản phẩm', value: products.length, icon: 'inventory_2', detail: `${pagination.total || products.length} sản phẩm` },
      { label: 'Đang hiển thị', value: visibleCount, icon: 'visibility', detail: 'Trên cửa hàng' },
      { label: 'Sắp hết hàng', value: lowStockCount, icon: 'warning', detail: 'Cần bổ sung kho' },
      { label: 'Đang ẩn', value: hiddenCount, icon: 'visibility_off', detail: 'Chưa công khai' },
    ];
  }, [pagination.total, products]);

  const pageStart = products.length > 0 ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const pageEnd   = products.length > 0 ? (pagination.current - 1) * pagination.pageSize + products.length : 0;

  const hasFilters = filters.keyword || filters.categoryId || filters.status !== '' ||
    filters.minPrice || filters.maxPrice || filters.sortBy;

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <h2 className="sr-only">Trang quản lý sản phẩm thời trang</h2>
      <div className="pm-wrap">

        {/* Top bar */}
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý sản phẩm</div>
            <div className="pm-subtitle">Tìm kiếm, lọc và quản lý toàn bộ sản phẩm trong hệ thống.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" onClick={handleDownloadTemplate}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>Tải file mẫu
            </button>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                id="bulk-import-input"
                hidden
                accept=".xlsx, .xls"
                onChange={handleBulkImport}
              />
              <button 
                className="btn-ghost" 
                onClick={() => document.getElementById('bulk-import-input').click()}
                disabled={importLoading}
              >
                {importLoading ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                )}
                Import sản phẩm
              </button>
            </div>
            <button className="btn-ghost">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>Xuất Excel
            </button>
            <button className="btn-primary" onClick={() => navigate('/admin/products/add')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px', background: '#fcebeb', color: '#a32d2d', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Import Result Overlay/Modal */}
        {importResult && (
          <div className="import-result-modal" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%',
              padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', margin: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Kết quả Import</h3>
                <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tổng cộng</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{importResult.totalRows}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase' }}>Thành công</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d' }}>{importResult.success}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700', textTransform: 'uppercase' }}>Thất bại</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#b91c1c' }}>{importResult.failed}</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Danh sách lỗi:</p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#b91c1c' }}>
                    {importResult.errors.map((err, i) => <div key={i} style={{ marginBottom: '4px' }}>• {err}</div>)}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setImportResult(null)}
                style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={stat.label} className={`stat-card ${stat.label === 'Sắp hết hàng' ? 'warn' : ''}`}>
              <div className={`stat-icon ${idx === 0 ? 'si-blue' : idx === 1 ? 'si-teal' : idx === 2 ? 'si-amber' : 'si-gray'}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-desc">{stat.detail}</div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="filter-bar">
          {/* Row 1: Search + quick selects + sort */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            {/* Search keyword */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '17px', color: '#94a3b8', pointerEvents: 'none'
              }}>search</span>
              <input
                type="text"
                value={keywordInput}
                onChange={handleKeywordChange}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Tìm theo tên sản phẩm... (Enter để tìm)"
                style={{
                  width: '100%', padding: '8px 40px 8px 34px', borderRadius: '6px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                }}
              />
              {keywordInput && (
                <button
                  onClick={handleKeywordSearch}
                  title="Tìm kiếm"
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: '#0f172a', border: 'none', borderRadius: '4px',
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                </button>
              )}
            </div>

            {/* Danh mục */}
            <select className="fselect" value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Trạng thái */}
            <select className="fselect" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang hiển thị</option>
              <option value="0">Đang ẩn</option>
            </select>

            {/* Sắp xếp */}
            <select className="fselect" value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                background: showAdvanced ? '#f1f5f9' : 'transparent',
                fontSize: '13px', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
              Bộ lọc nâng cao
            </button>

            {hasFilters && (
              <button onClick={clearFilters} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                background: '#fef2f2', fontSize: '13px', color: '#dc2626',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>Xóa lọc
              </button>
            )}
          </div>

          {/* Row 2: Advanced filters (toggle) */}
          {showAdvanced && (
            <div className="advanced-filter-row" style={{
              display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
              paddingTop: '12px', borderTop: '1px solid #f1f5f9',
            }}>
              {/* Giá từ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>Giá từ</span>
                <input
                  type="text" inputMode="numeric" placeholder="0"
                  value={formatPriceDisplay(advancedInput.minPrice)}
                  onChange={(e) => setAdvancedInput(prev => ({ ...prev, minPrice: parsePriceRaw(e.target.value) }))}
                  style={{
                    width: '110px', padding: '7px 10px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '13px', fontFamily: 'inherit', outline: 'none', textAlign: 'right',
                  }}
                />
              </div>

              {/* Giá đến */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>đến</span>
                <input
                  type="text" inputMode="numeric" placeholder="∞"
                  value={formatPriceDisplay(advancedInput.maxPrice)}
                  onChange={(e) => setAdvancedInput(prev => ({ ...prev, maxPrice: parsePriceRaw(e.target.value) }))}
                  style={{
                    width: '110px', padding: '7px 10px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '13px', fontFamily: 'inherit', outline: 'none', textAlign: 'right',
                  }}
                />
              </div>

              {/* Màu sắc */}
              <input
                type="text" placeholder="Màu sắc (VD: Đen)"
                value={advancedInput.color}
                onChange={(e) => setAdvancedInput(prev => ({ ...prev, color: e.target.value }))}
                style={{
                  width: '140px', padding: '7px 10px', borderRadius: '6px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '13px', fontFamily: 'inherit', outline: 'none',
                }}
              />

              {/* Size */}
              <select className="fselect" value={advancedInput.size}
                onChange={(e) => setAdvancedInput(prev => ({ ...prev, size: e.target.value }))}>
                <option value="">Tất cả size</option>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Nút Lọc */}
              <button
                onClick={handleAdvancedApply}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '7px 16px', borderRadius: '6px', border: 'none',
                  background: '#0f172a', color: '#fff', fontSize: '13px',
                  fontFamily: 'inherit', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>filter_list</span>
                Lọc
              </button>
            </div>
          )}

          {/* Row 3: counts */}
          <div className="filter-counts" style={{ marginTop: '10px' }}>
            <span className="dot-count"><span className="dot dot-teal" />{products.filter(p => Number(p.status) !== 0).length} đang hiển thị</span>
            <span className="dot-count"><span className="dot dot-gray" />{pagination.total} kết quả</span>
            {loading && <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang tải...
            </span>}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <div className="tbl-header">
            <div className="th"></div>
            <div className="th">Tên sản phẩm</div>
            <div className="th">Danh mục</div>
            <div className="th right">Giá bán</div>
            <div className="th center">Trạng thái</div>
            <div className="th right">Thao tác</div>
          </div>

          {products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              {loading ? 'Đang tải...' : 'Không tìm thấy sản phẩm phù hợp.'}
            </div>
          ) : (
            products.map((product) => {
              const totalStock = Number(product.totalStock) || 0;
              const variantCount = product.variants?.length || 0;
              const isVisible = Number(product.status) !== 0;

              return (
                <div className="tbl-row" key={product.id}>
                  <div>
                    <div className="prod-thumb">
                      {product.thumbnailUrl || product.thumbnail_url ? (
                        <img
                          src={getImageUrl(product.thumbnailUrl || product.thumbnail_url)}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x140?text=?'; }}
                        />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>checkroom</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="prod-name">{product.name}</div>
                    <div className="prod-meta">
                      <span className="prod-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>palette</span>{variantCount} biến thể
                      </span>
                      <span className="prod-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>layers</span>Kho: {totalStock}
                      </span>
                    </div>
                  </div>
                  <div><span className="badge badge-cat">{product.categoryName || 'Chưa phân loại'}</span></div>
                  <div>
                    <div className="price-val">{formatCurrency(product.basePrice || 0)}</div>
                    <div className="price-note">Giá gốc</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${isVisible ? (totalStock > 0 ? 'badge-green' : 'badge-red') : 'badge-red'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleToggleVisibility(product.id)}
                      title="Click để Ẩn/Hiện sản phẩm"
                    >
                      <span className="dot" style={{ width: '5px', height: '5px', borderRadius: '50%', marginRight: '4px' }} />
                      {isVisible ? (totalStock > 0 ? `Còn hàng (${totalStock})` : 'Hết hàng') : 'Đang ẩn'}
                    </span>
                  </div>
                  <div>
                    <div className="act-row">
                      <button className="act-btn" onClick={() => navigate(`/admin/products/detail/${product.id}`)} title="Xem chi tiết">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>Xem
                      </button>
                      <button className="act-btn" onClick={() => navigate(`/admin/products/variants/${product.id}`)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>style</span>Kho
                      </button>
                      <button className="act-btn edit" onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>Sửa
                      </button>
                      <button className="act-btn del" onClick={() => handleDelete(product.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer / Pagination */}
          <div className="tbl-footer">
            <span className="footer-text">
              Hiển thị <strong>{pageStart} – {pageEnd}</strong> / <strong>{pagination.total}</strong> sản phẩm
            </span>
            <div className="pager">
              <button className="page-btn" disabled={pagination.current <= 1}
                onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    className={`page-btn ${pagination.current === page ? 'active' : ''}`}
                    onClick={() => setPagination(p => ({ ...p, current: page }))}
                  >{page}</button>
                );
              })}
              {pagination.pages > 5 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>}
              <button className="page-btn" disabled={pagination.current >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default AdminProducts;
