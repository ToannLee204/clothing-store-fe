import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `${currencyFormatter.format(numericValue)}đ`;
};

const formatNumberWithDots = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numericValue = String(value).replace(/\D/g, '');
  if (!numericValue) return '';
  return currencyFormatter.format(Number(numericValue));
};

const getStockMeta = (stockQty) => {
  const stock = Number(stockQty) || 0;

  if (stock === 0) {
    return {
      label: 'Hết hàng',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      stockCardTone: 'border-stone-200 bg-stone-100 text-stone-700',
    };
  }

  if (stock < 10) {
    return {
      label: 'Sắp hết',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      stockCardTone: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  return {
    label: 'Sẵn hàng',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    stockCardTone: 'border-stone-200 bg-stone-100 text-stone-700',
  };
};

const summaryIconMap = {
  layers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  ),
  warehouse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  ),
  inventory_2: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const rowActionIcon = {
  edit: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  delete: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
};

const pageActionIcon = {
  back: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  star: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  edit: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  add: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

const EmptyState = ({ onAdd }) => (
  <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        <path d="M9 9h6" />
      </svg>
    </div>
    <h4 className="mt-4 text-lg font-semibold text-stone-900">Chưa có biến thể nào</h4>
    <p className="mt-2 text-sm leading-6 text-stone-400">
      Hãy thêm biến thể đầu tiên để bắt đầu quản lý màu sắc, size, SKU và tồn kho.
    </p>
    <button
      onClick={onAdd}
      className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
    >
      {pageActionIcon.add}
      Thêm biến thể
    </button>
  </div>
);

const Field = ({ label, required = false, hint, children }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="font-medium normal-case tracking-normal text-stone-300"> {hint}</span>}
    </label>
    {children}
  </div>
);

const inputClassName =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 transition-all outline-none placeholder:text-stone-300 focus:border-[#3b5bdb] focus:shadow-[0_0_0_3px_rgba(59,91,219,0.08)]';

const AdminProductVariants = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    color: '',
    size: '',
    sku: '',
    stockQty: 0,
    salePrice: '',
  });

  const API_URL = `/api/v1/admin/products/${id}`;
  const token = localStorage.getItem('token');

  const fetchVariantData = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await response.json();

      if (response.ok && res.data) {
        setProduct(res.data);
        setVariants(res.data.variants || []);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchVariantData();
  }, [fetchVariantData]);

  const updateProductToServer = async (newVariantsList) => {
    setIsSaving(true);
    try {
      const payload = {
        name: product.name,
        categoryId: product.category?.id,
        description: product.description,
        basePrice: product.basePrice,
        status: product.status,
        thumbnailUrl: product.thumbnailUrl,
        imageUrls: product.imageUrls || [],
        variants: newVariantsList.map((v) => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null,
        })),
      };

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchVariantData();
        setIsModalOpen(false);
      } else {
        const text = await response.text();
        alert('Lỗi khi lưu: ' + text);
      }
    } catch {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingIndex(null);
    setFormData({
      color: '',
      size: '',
      sku: '',
      stockQty: 0,
      salePrice: '',
    });
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
      salePrice: variant.salePrice || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveVariant = (e) => {
    e.preventDefault();

    if (!formData.sku.trim()) {
      alert('Mã SKU là bắt buộc!');
      return;
    }

    const normalizedFormData = {
      ...formData,
      stockQty: Number(formData.stockQty) || 0,
      salePrice: formData.salePrice === '' ? '' : Number(formData.salePrice),
    };

    let newVariantsList;

    if (modalMode === 'add') {
      newVariantsList = [...variants, normalizedFormData];
    } else {
      newVariantsList = [...variants];
      newVariantsList[editingIndex] = normalizedFormData;
    }

    updateProductToServer(newVariantsList);
  };

  const handleDeleteVariant = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
      const newVariantsList = variants.filter((_, i) => i !== index);
      updateProductToServer(newVariantsList);
    }
  };

  const summary = useMemo(() => {
    const totalVariants = variants.length;
    const totalStock = variants.reduce((sum, item) => sum + (Number(item.stockQty) || 0), 0);
    const activeVariants = variants.filter((item) => Number(item.stockQty) > 0).length;
    const lowStockVariants = variants.filter((item) => {
      const stock = Number(item.stockQty) || 0;
      return stock > 0 && stock < 10;
    }).length;

    return [
      {
        label: 'Tổng biến thể',
        value: totalVariants,
        caption: 'Đang được quản lý',
        icon: 'layers',
        iconTone: 'bg-brand-50 text-[#3b5bdb]',
        borderTone: 'border-stone-200',
      },
      {
        label: 'Tồn kho cộng dồn',
        value: totalStock,
        caption: 'Tất cả biến thể',
        icon: 'warehouse',
        iconTone: 'bg-stone-100 text-stone-500',
        borderTone: 'border-stone-200',
      },
      {
        label: 'Biến thể còn hàng',
        value: activeVariants,
        caption: 'Đang bán được',
        icon: 'inventory_2',
        iconTone: 'bg-green-50 text-green-700',
        borderTone: 'border-stone-200',
      },
      {
        label: 'Biến thể sắp hết',
        value: lowStockVariants,
        caption: 'Cần bổ sung kho',
        icon: 'warning',
        iconTone: 'bg-amber-50 text-amber-700',
        borderTone: 'border-amber-100',
      },
    ];
  }, [variants]);

  const selectedVariantLabel =
    modalMode === 'edit' ? [formData.color || 'N/A', formData.size || 'N/A'].join(' / ') : 'Biến thể mới';

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-stone-100 px-6">
        <div className="rounded-2xl border border-stone-200 bg-white px-8 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
          <p className="text-sm font-medium text-stone-500">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-stone-100 text-stone-800">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_20px_60px_rgba(28,25,23,0.14)]">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[#3b5bdb]">
                  {pageActionIcon.edit}
                </div>
                <h3 className="text-sm font-semibold text-stone-800">
                  {modalMode === 'add' ? 'Thêm biến thể mới' : 'Chỉnh sửa biến thể'}{' '}
                  <span className="text-[#3b5bdb]">{selectedVariantLabel}</span>
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-5 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Màu sắc">
                  <input
                    type="text"
                    className={inputClassName}
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Đen"
                  />
                </Field>

                <Field label="Kích cỡ">
                  <input
                    type="text"
                    className={inputClassName}
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="L"
                  />
                </Field>

                <Field label="Tồn kho">
                  <input
                    type="number"
                    min="0"
                    className={inputClassName}
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                  />
                </Field>

                <Field label="Giá sale" hint="(trống = không sale)">
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClassName}
                    value={formatNumberWithDots(formData.salePrice)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="123.000"
                  />
                </Field>
              </div>

              <Field label="Mã SKU" required>
                <input
                  type="text"
                  required
                  className={`${inputClassName} font-mono`}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-12345"
                />
              </Field>

              <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="sticky top-20 z-30 border-b border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex  flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 font-medium text-stone-500 transition-colors hover:bg-stone-50"
            >
              {pageActionIcon.back}
              Quay lại danh sách
            </button>

            <span className="text-stone-300">·</span>

            
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/admin/products/edit/${id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
            >
              {pageActionIcon.edit}
              Sửa chung
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              {pageActionIcon.add}
              Thêm biến thể mới
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6">
        <section className="animate-[fadeIn_.25s_ease]">
          <h1
            className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Biến thể sản phẩm
          </h1>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-stone-400">
            Quản lý biến thể theo phong cách dashboard hiện đại, tối ưu khả năng đọc, thao tác nhanh và theo dõi tồn
            kho.
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border ${item.borderTone} bg-white p-4 transition duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">{item.label}</p>
                  <p className="text-3xl font-semibold leading-none text-stone-900">{item.value}</p>
                  <p className="mt-1.5 text-[11px] text-stone-400">{item.caption}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconTone}`}>
                  {summaryIconMap[item.icon]}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-800">Danh sách biến thể</h2>
              <p className="mt-0.5 text-xs text-stone-400">
                Tối ưu hiển thị bảng theo kiểu card-table, dễ nhìn hơn khi có nhiều biến thể.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3b5bdb]" />
                {variants.length} biến thể
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stone-300" />
                {product?.name || product?.category?.name || 'Chưa có tên sản phẩm'}
              </span>
            </div>
          </div>

          {variants.length === 0 ? (
            <EmptyState onAdd={openAddModal} />
          ) : (
            <>
              <div
                className="hidden border-b border-stone-100 bg-stone-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 md:grid"
                style={{ gridTemplateColumns: '1.8fr 0.8fr 1fr 0.7fr 0.9fr 0.8fr' }}
              >
                <span>Phân loại</span>
                <span>SKU</span>
                <span>Giá bán / Sale</span>
                <span>Tồn kho</span>
                <span>Trạng thái</span>
                <span className="text-right">Thao tác</span>
              </div>

              <div>
                {variants.map((variant, index) => {
                  const stockMeta = getStockMeta(variant.stockQty);
                  const price = Number(variant.salePrice || product?.basePrice || 0);
                  const basePrice = Number(product?.basePrice || 0);
                  const hasSale = variant.salePrice && Number(variant.salePrice) < basePrice;

                  return (
                    <div
                      key={`${variant.sku || 'variant'}-${index}`}
                      className="border-b border-stone-100 px-5 py-4 transition-colors hover:bg-stone-50"
                    >
                      <div
                        className="hidden items-center gap-4 md:grid"
                        style={{ gridTemplateColumns: '1.8fr 0.8fr 1fr 0.7fr 0.9fr 0.8fr' }}
                      >
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                              {variant.color || 'N/A'}
                            </span>
                            <span className="h-3 w-px bg-stone-200" />
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                              {variant.size || 'N/A'}
                            </span>
                          </div>
                          <p className="max-w-xs text-[11px] leading-snug text-stone-400">
                            Phân loại hiển thị dưới dạng chip để quét nhanh hơn.
                          </p>
                        </div>

                        <div>
                          <span className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-mono text-stone-500">
                            {variant.sku || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-stone-900">{formatCurrency(price)}</p>
                          {hasSale ? (
                            <p className="mt-0.5 text-[11px] text-stone-400 line-through">{formatCurrency(basePrice)}</p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-stone-400">Chưa có giá sale</p>
                          )}
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-semibold ${stockMeta.stockCardTone}`}
                          >
                            {Number(variant.stockQty) || 0}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${stockMeta.tone}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stockMeta.dot}`} />
                            {stockMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(variant, index)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100"
                          >
                            {rowActionIcon.edit}
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(index)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                          >
                            {rowActionIcon.delete}
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                {variant.color || 'N/A'}
                              </span>
                              <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                {variant.size || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-stone-500">{variant.sku || 'N/A'}</p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${stockMeta.tone}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stockMeta.dot}`} />
                            {stockMeta.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-stone-50 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-stone-400">Giá bán</p>
                            <p className="mt-1 font-semibold text-stone-900">{formatCurrency(price)}</p>
                            {hasSale && <p className="mt-0.5 text-[11px] text-stone-400 line-through">{formatCurrency(basePrice)}</p>}
                          </div>
                          <div className="rounded-xl bg-stone-50 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-stone-400">Tồn kho</p>
                            <p className="mt-1 font-semibold text-stone-900">{Number(variant.stockQty) || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(variant, index)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100"
                          >
                            {rowActionIcon.edit}
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(index)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                          >
                            {rowActionIcon.delete}
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between bg-stone-50 px-5 py-3.5">
                <p className="text-xs text-stone-400">
                  Đang hiển thị <span className="font-semibold text-stone-600">{variants.length}</span> trong số{' '}
                  <span className="font-semibold text-stone-600">{variants.length}</span> biến thể
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400">
                    {pageActionIcon.back}
                  </span>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-stone-900 bg-stone-900 px-2 text-xs font-semibold text-white">
                    1
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminProductVariants;
