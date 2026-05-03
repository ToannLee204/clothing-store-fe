import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `${currencyFormatter.format(numericValue)}đ`;
};

const getStockMeta = (stockQty) => {
  const stock = Number(stockQty) || 0;

  if (stock === 0) {
    return {
      label: 'Hết hàng',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  }

  if (stock < 10) {
    return {
      label: 'Sắp hết',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    };
  }

  return {
    label: 'Sẵn hàng',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  };
};

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

  const fetchVariantData = async () => {
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
  };

  useEffect(() => {
    fetchVariantData();
  }, [id]);

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
    } catch (err) {
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
        icon: 'layers',
        accent: 'from-[#ec5b13] to-[#ff8a4c]',
      },
      {
        label: 'Tồn kho cộng dồn',
        value: totalStock,
        icon: 'warehouse',
        accent: 'from-slate-600 to-slate-400',
      },
      {
        label: 'Biến thể còn hàng',
        value: activeVariants,
        icon: 'inventory_2',
        accent: 'from-emerald-500 to-emerald-400',
      },
      {
        label: 'Biến thể sắp hết',
        value: lowStockVariants,
        icon: 'warning',
        accent: 'from-amber-500 to-amber-400',
      },
    ];
  }, [variants]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f8f6f6]">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/70 bg-white/90 px-8 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#ec5b13]">
            progress_activity
          </span>
          <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex-1 overflow-auto bg-[#f8f6f6] px-4 py-6 pb-20 sm:px-6 lg:px-8">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/90 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                  <span className="material-symbols-outlined text-[16px]">layers</span>
                  {modalMode === 'add' ? 'Thêm biến thể' : 'Chỉnh sửa biến thể'}
                </div>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
                  {modalMode === 'add' ? 'Tạo biến thể mới' : 'Cập nhật biến thể hiện tại'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Cập nhật màu sắc, size, SKU, tồn kho và giá sale trong một form gọn gàng.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Màu sắc
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Đen, Trắng..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Kích cỡ
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="S, M, L..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Mã SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="VD: SKU-12345"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Giá sale <span className="font-medium normal-case tracking-normal text-slate-400">(tùy chọn)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="Bỏ trống nếu không giảm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  Lưu biến thể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ec5b13] via-[#ff8a4c] to-[#ffd0b0]" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ec5b13]/8 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <button
              onClick={() => navigate('/admin/products')}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại danh sách sản phẩm
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
              <span className="material-symbols-outlined text-[16px]">layers</span>
              Admin / Biến thể sản phẩm
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Biến thể sản phẩm
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Trang quản lý biến thể được làm lại theo phong cách dashboard hiện đại, giữ nguyên bảng màu
              của hệ thống nhưng tối ưu khả năng đọc, thao tác nhanh và theo dõi tồn kho.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
            <button
              onClick={() => navigate(`/admin/products/edit/${id}`)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Sửa chung
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d95210]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm biến thể mới
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách biến thể</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tối ưu hiển thị bảng theo kiểu card-table hiện đại, dễ nhìn hơn khi có nhiều biến thể.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              <span className="size-2 rounded-full bg-[#ec5b13]" />
              {variants.length} biến thể
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              <span className="size-2 rounded-full bg-slate-400" />
              {product?.category?.name || 'Chưa phân loại'}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Phân loại
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">
                  SKU
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right">
                  Giá bán / Sale
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">
                  Tồn kho
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
              {variants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ec5b13]/10 text-[#ec5b13]">
                        <span className="material-symbols-outlined text-[30px]">inventory_2_off</span>
                      </div>
                      <h4 className="mt-4 text-lg font-bold text-slate-900">
                        Chưa có biến thể nào
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Hãy thêm biến thể đầu tiên để bắt đầu quản lý màu sắc, size, SKU và tồn kho.
                      </p>
                      <button
                        onClick={openAddModal}
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210]"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Thêm biến thể
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                variants.map((v, index) => {
                  const stockMeta = getStockMeta(v.stockQty);
                  const price = Number(v.salePrice || product?.basePrice || 0);
                  const basePrice = Number(product?.basePrice || 0);
                  const hasSale = v.salePrice && Number(v.salePrice) < basePrice;

                  return (
                    <tr key={index} className="group transition hover:bg-[#fdf7f3]">
                      <td className="px-6 py-5 align-middle">
                        <div className="max-w-[240px]">
                          <div className="text-sm font-bold text-slate-900">
                            {v.color || 'N/A'} <span className="mx-1 text-slate-300">|</span> {v.size || 'N/A'}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Phân loại hiển thị dưới dạng chip để dễ quét nhanh hơn.
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600">
                          {v.sku || 'N/A'}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle text-right">
                        <div className="text-sm font-black text-slate-900">{formatCurrency(price)}</div>
                        {hasSale && (
                          <div className="mt-1 text-xs text-slate-400 line-through">
                            {formatCurrency(basePrice)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                          {Number(v.stockQty) || 0}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <span
                          className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${stockMeta.tone}`}
                        >
                          <span className={`size-2 rounded-full ${stockMeta.dot}`} />
                          {stockMeta.label}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(v, index)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ec5b13]/15 bg-[#ec5b13]/10 px-3 py-2 text-xs font-semibold text-[#c84c10] transition hover:bg-[#ec5b13]/15"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDeleteVariant(index)}
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
      </section>
    </main>
  );
};

export default AdminProductVariants;
