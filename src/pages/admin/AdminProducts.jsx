import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `${currencyFormatter.format(numericValue)}đ`;
};

const getProductStatusMeta = (product) => {
  const isVisible = Number(product?.status) !== 0;
  const totalStock = Number(product?.totalStock) || 0;

  if (!isVisible) {
    return {
      label: 'Đã ẩn',
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      button: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
    };
  }

  if (totalStock === 0) {
    return {
      label: 'Hết hàng',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      button: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    };
  }

  if (totalStock < 10) {
    return {
      label: `Sắp hết (${totalStock})`,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      button: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    };
  }

  return {
    label: `Còn hàng (${totalStock})`,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    button: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  };
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, pages: 1 });

  const [filters, setFilters] = useState({ categoryId: '', status: '' });

  const PRODUCT_API_URL = '/api/v1/admin/products';
  const CATEGORY_API_URL = '/api/v1/categories';
  const token = localStorage.getItem('token');

  const handleViewVariants = (productId) => {
    navigate(`/admin/products/variants/${productId}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({ categoryId: '', status: '' });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(CATEGORY_API_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let actualData = {};

      if (text) {
        try {
          actualData = JSON.parse(text);
        } catch (e) {
          actualData = {};
        }
      }

      if (response.ok) {
        setCategories(actualData.data || actualData || []);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Danh mục:', err);
    }
  };

  const fetchProducts = async (page = 1) => {
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        pageSize: pagination.pageSize || 10,
      });

      if (filters.categoryId) {
        queryParams.append('categoryId', filters.categoryId);
      }

      if (filters.status !== '') {
        queryParams.append('status', filters.status);
      }

      const response = await fetch(`${PRODUCT_API_URL}?${queryParams.toString()}`, {
        method: 'GET',
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
            } catch (err) {
              return { ...p, variants: [], totalStock: 0 };
            }
          })
        );

        setProducts(fullProducts);
        setPagination({
          current: meta.page !== undefined ? meta.page + 1 : 1,
          pageSize: meta.pageSize || 10,
          total: meta.totals || meta.totalElements || 0,
          pages: meta.pages || meta.totalPages || 1,
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

  useEffect(() => {
    fetchProducts(pagination.current);
  }, [filters, pagination.current]);

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
    } catch (err) {
      alert('Không thể kết nối Server để xóa.');
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      const response = await fetch(`${PRODUCT_API_URL}/${id}/visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchProducts(pagination.current);
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
    }
  };

  const stats = useMemo(() => {
    const visibleCount = products.filter((product) => Number(product.status) !== 0).length;
    const hiddenCount = products.filter((product) => Number(product.status) === 0).length;
    const lowStockCount = products.filter((product) => {
      const isVisible = Number(product.status) !== 0;
      const totalStock = Number(product.totalStock) || 0;
      return isVisible && totalStock < 10;
    }).length;

    return [
      {
        label: 'Tổng sản phẩm',
        value: products.length,
        icon: 'inventory_2',
        accent: 'from-[#0066A2] to-[#3385b5]',
        detail: `${pagination.total || products.length} sản phẩm trong hệ thống`,
      },
      {
        label: 'Đang hiển thị',
        value: visibleCount,
        icon: 'visibility',
        accent: 'from-emerald-500 to-emerald-400',
        detail: 'Sản phẩm đang xuất hiện trên cửa hàng',
      },
      {
        label: 'Sắp hết hàng',
        value: lowStockCount,
        icon: 'warning',
        accent: 'from-amber-500 to-amber-400',
        detail: 'Cần bổ sung tồn kho sớm',
      },
      {
        label: 'Đang ẩn',
        value: hiddenCount,
        icon: 'visibility_off',
        accent: 'from-slate-500 to-slate-400',
        detail: 'Sản phẩm chưa công khai',
      },
    ];
  }, [pagination.total, products]);

  const pageStart = products.length > 0 ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const pageEnd = products.length > 0 ? (pagination.current - 1) * pagination.pageSize + products.length : 0;
  const hasFilters = filters.categoryId || filters.status !== '';

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <h2 className="sr-only">Trang quản lý sản phẩm thời trang — bao gồm thống kê, bộ lọc và danh sách sản phẩm</h2>
      <div className="pm-wrap">

        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý sản phẩm</div>
            <div className="pm-subtitle">Theo dõi tồn kho, trạng thái và xử lý sản phẩm nhanh chóng ngay tại đây.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span> Xuất Excel</button>
            <button className="btn-primary" onClick={() => navigate('/admin/products/add')}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Thêm sản phẩm</button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fcebeb', color: '#a32d2d', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

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

        <div className="filter-bar">
          <div className="filter-top">
            <span className="filter-label">Bộ lọc & thao tác nhanh</span>
            <span className="filter-adv" onClick={clearFilters}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span> {hasFilters ? 'Xóa lọc' : 'Lọc nâng cao'}</span>
          </div>
          <div className="filter-row">
            <div className="filter-selects">
              <select className="fselect" value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)}>
                <option value="">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select className="fselect" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="1">Đang hiển thị</option>
                <option value="0">Đang ẩn</option>
              </select>
            </div>
            <div className="filter-counts">
              <span className="dot-count"><span className="dot dot-teal"></span> {products.filter(p => Number(p.status) !== 0).length} đang hiển thị</span>
              <span className="dot-count"><span className="dot dot-gray"></span> {pagination.total} kết quả</span>
            </div>
          </div>
        </div>

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
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Không tìm thấy sản phẩm phù hợp.</div>
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
                          src={product.thumbnailUrl || product.thumbnail_url} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x140?text=Error'; }}
                        />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>checkroom</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="prod-name">{product.name}</div>
                    <div className="prod-meta">
                      <span className="prod-tag"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>palette</span> {variantCount} biến thể</span>
                      <span className="prod-tag"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>layers</span> Tồn kho {totalStock}</span>
                    </div>
                  </div>
                  <div><span className="badge badge-cat">{product.categoryName || 'Chưa phân loại'}</span></div>
                  <div>
                    <div className="price-val">{formatCurrency(product.basePrice || 0)}</div>
                    <div className="price-note">Giá gốc hệ thống</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span 
                      className={`badge ${isVisible ? (totalStock > 0 ? 'badge-green' : 'badge-red') : 'badge-red'}`} 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleToggleVisibility(product.id)}
                      title="Click để Ẩn/Hiện sản phẩm"
                    >
                      <span className="dot" style={{ width: '5px', height: '5px', borderRadius: '50%', marginRight: '4px' }}></span>
                      {isVisible ? (totalStock > 0 ? `Còn hàng (${totalStock})` : 'Hết hàng') : 'Đang ẩn'}
                    </span>
                  </div>
                  <div>
                    <div className="act-row">
                      <button className="act-btn" onClick={() => handleViewVariants(product.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>style</span> Kho
                      </button>
                      <button className="act-btn edit" onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span> Sửa
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

          <div className="tbl-footer">
            <span className="footer-text">Đang hiển thị <strong>{pageStart} – {pageEnd}</strong> trong số <strong>{pagination.total}</strong> sản phẩm</span>
            <div className="pager">
              <button 
                className="page-btn" 
                disabled={pagination.current <= 1} 
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              <button className="page-btn active">{pagination.current}</button>
              <button 
                className="page-btn" 
                disabled={pagination.current >= pagination.pages} 
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
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

export default AdminProducts;
