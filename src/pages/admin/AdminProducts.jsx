import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        accent: 'from-[#ec5b13] to-[#ff8a4c]',
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
    <main className="flex-1 min-h-screen overflow-auto bg-[#f8f6f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ec5b13] via-[#ff8a4c] to-[#ffd0b0]" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ec5b13]/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                Admin / Sản phẩm
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Quản lý sản phẩm
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Giao diện được làm mới theo phong cách hiện đại, giữ nguyên tông màu chủ đạo của hệ thống
                nhưng tối ưu hơn cho thao tác quản trị, quan sát tồn kho và xử lý sản phẩm nhanh.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Danh mục</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{categories.length} nhóm</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Trang hiện tại</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {pagination.current}/{pagination.pages}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Bộ lọc</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {hasFilters ? 'Đang áp dụng' : 'Chưa lọc'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
              <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                Xuất Excel
              </button>
              <button
                onClick={() => navigate('/admin/products/add')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d95210]"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Thêm sản phẩm
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
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

        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bộ lọc & thao tác nhanh</h3>
              <p className="mt-1 text-sm text-slate-500">Lọc danh mục, trạng thái và giữ layout gọn hơn cho màn quản trị.</p>
            </div>

            <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Lọc nâng cao
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-[220px]">
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                  expand_more
                </span>
              </div>

              <div className="relative min-w-[220px]">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đang hiển thị</option>
                  <option value="0">Đang ẩn</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                  expand_more
                </span>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
                <span className="size-2 rounded-full bg-[#ec5b13]" />
                {products.length} sản phẩm đang hiển thị
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
                <span className="size-2 rounded-full bg-slate-400" />
                {pagination.total} tổng kết quả
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200">
                  <th className="w-24 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Ảnh
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Tên sản phẩm
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Danh mục
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Giá bán
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
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ec5b13]/10 text-[#ec5b13]">
                          <span className="material-symbols-outlined text-[30px]">inventory_2_off</span>
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy sản phẩm phù hợp</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Hãy thử bỏ bớt bộ lọc hoặc thêm mới một sản phẩm để hiển thị trong danh sách.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const statusMeta = getProductStatusMeta(product);
                    const totalStock = Number(product.totalStock) || 0;
                    const variantCount = product.variants?.length || 0;

                    return (
                      <tr
                        key={product.id}
                        className="group transition hover:bg-[#fdf7f3]"
                      >
                        <td className="px-6 py-5 align-middle">
                          <div className="relative h-16 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                            <img
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              src={
                                product.thumbnailUrl ||
                                product.thumbnail_url ||
                                'https://placehold.co/100x140?text=No+Image'
                              }
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/100x140?text=Error';
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="max-w-[360px]">
                            <div className="text-sm font-bold text-slate-900">
                              {product.name}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                                <span className="material-symbols-outlined text-[14px]">layers</span>
                                {variantCount} biến thể
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                                <span className="material-symbols-outlined text-[14px]">warehouse</span>
                                Tồn kho {totalStock}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {product.categoryName || 'Chưa phân loại'}
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="text-sm font-black text-slate-900">
                            {formatCurrency(product.basePrice || 0)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">Giá gốc hiển thị trong hệ thống</div>
                        </td>

                        <td className="px-6 py-5 align-middle text-center">
                          <button
                            onClick={() => handleToggleVisibility(product.id)}
                            title="Click để Ẩn/Hiện sản phẩm"
                            className={`inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${statusMeta.button}`}
                          >
                            <span className={`size-2 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                          </button>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewVariants(product.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <span className="material-symbols-outlined text-[16px]">style</span>
                              Kho
                            </button>

                            <button
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ec5b13]/15 bg-[#ec5b13]/10 px-3 py-2 text-xs font-semibold text-[#c84c10] transition hover:bg-[#ec5b13]/15"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              Sửa
                            </button>

                            <button
                              onClick={() => handleDelete(product.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
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

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Đang hiển thị{' '}
              <span className="font-bold text-slate-900">
                {pageStart}
              </span>{' '}
              -{' '}
              <span className="font-bold text-slate-900">
                {pageEnd}
              </span>{' '}
              trong số{' '}
              <span className="font-bold text-slate-900">
                {pagination.total}
              </span>{' '}
              sản phẩm
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current <= 1}
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <button className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#ec5b13] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(236,91,19,0.2)]">
                {pagination.current}
              </button>

              <button
                disabled={pagination.current >= pagination.pages}
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminProducts;
