import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parseResponseBody, extractMessage, jsonAuthHeaders } from '../../api/http';
import './AdminAddProduct.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `${currencyFormatter.format(numericValue)}đ`;
};

const getStockMeta = (stockQty) => {
  const stock = Number(stockQty) || 0;
  if (stock === 0) return { label: 'Hết hàng', tone: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
  if (stock < 10) return { label: 'Sắp hết', tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
  return { label: 'Sẵn hàng', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
};

const AdminProductVariants = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicateIndices, setDuplicateIndices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Filter state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    color: '',
    size: '',
    sortBy: ''
  });

  const SORT_OPTIONS = [
    { value: '', label: 'Mặc định' },
    { value: 'color', label: 'Theo màu sắc' },
    { value: 'size', label: 'Theo kích cỡ' },
    { value: 'stock_asc', label: 'Tồn kho (Thấp - Cao)' },
    { value: 'stock_desc', label: 'Tồn kho (Cao - Thấp)' },
    { value: 'price_asc', label: 'Giá bán (Thấp - Cao)' },
    { value: 'price_desc', label: 'Giá bán (Cao - Thấp)' },
  ];

  const STANDARD_COLORS = [
    { code: "BLACK", name: "Màu đen" },
    { code: "WHITE", name: "Màu trắng" },
    { code: "RED", name: "Màu đỏ" },
    { code: "BLUE", name: "Xanh dương" },
    { code: "GREEN", name: "Xanh lá" },
    { code: "YELLOW", name: "Màu vàng" },
    { code: "PINK", name: "Màu hồng" },
    { code: "PURPLE", name: "Màu tím" },
    { code: "GRAY", name: "Màu xám" },
    { code: "BROWN", name: "Màu nâu" },
    { code: "ORANGE", name: "Màu cam" },
    { code: "BEIGE", name: "Màu be" },
    { code: "NAVY", name: "Xanh navy" },
    { code: "MULTI", name: "Nhiều màu" },
    { code: "OTHER", name: "Màu khác" }
  ];

  const STANDARD_SIZES = [
    { code: "XS", name: "XS" },
    { code: "S", name: "S" },
    { code: "M", name: "M" },
    { code: "L", name: "L" },
    { code: "XL", name: "XL" },
    { code: "XXL", name: "XXL" },
    { code: "SIZE_35", name: "35" },
    { code: "SIZE_36", name: "36" },
    { code: "SIZE_37", name: "37" },
    { code: "SIZE_38", name: "38" },
    { code: "SIZE_39", name: "39" },
    { code: "SIZE_40", name: "40" },
    { code: "SIZE_41", name: "41" },
    { code: "SIZE_42", name: "42" },
    { code: "SIZE_43", name: "43" },
    { code: "SIZE_44", name: "44" },
    { code: "SIZE_45", name: "45" },
    { code: "FREESIZE", name: "Freesize" },
    { code: "OTHER", name: "Khác" }
  ];

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/admin/products/${id}`, {
        headers: jsonAuthHeaders()
      });
      const res = await parseResponseBody(response);
      if (response.ok && res.data) {
        setProduct(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin sản phẩm:', err);
      setError('Không thể tải thông tin sản phẩm.');
    }
  }, [id]);

  const fetchVariants = useCallback(async (page = 0, currentFilters = filters) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page,
        pageSize: pagination.pageSize,
      });

      if (currentFilters.color) queryParams.append('color', currentFilters.color);
      if (currentFilters.size) queryParams.append('size', currentFilters.size);
      if (currentFilters.sortBy) queryParams.append('sortBy', currentFilters.sortBy);

      const response = await fetch(`/api/v1/admin/products/${id}/variants?${queryParams.toString()}`, {
        headers: jsonAuthHeaders()
      });
      const res = await parseResponseBody(response);
      const dataPayload = res.data || res;
      const resultItems = dataPayload.result || [];
      const metaData = dataPayload.meta || {};

      if (response.ok) {
        const mappedVariants = resultItems.map(v => ({ ...v, isModified: false, isNew: false }));
        setVariants(mappedVariants);
        setPagination(prev => ({
          ...prev,
          currentPage: metaData.page ?? 0,
          pageSize: metaData.pageSize ?? 20,
          totalElements: metaData.totals ?? metaData.totalElements ?? resultItems.length,
          totalPages: metaData.pages ?? 1
        }));
      } else {
        setVariants([]);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách biến thể:', err);
      setError('Không thể tải danh sách biến thể.');
    } finally {
      setLoading(false);
    }
  }, [id, pagination.pageSize, filters]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    fetchVariants(0);
  }, [id, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ color: '', size: '', sortBy: '' });
  };

  // AttributeSelector component
  const AttributeSelector = ({ value, onChange, options, placeholder, isError, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (opt) => {
      onChange(opt.name);
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div className={`relative ${isOpen ? "z-[100]" : "z-0"} ${className}`} ref={containerRef}>
        <div className="relative">
          <input
            className={`w-full bg-transparent border ${isError ? "border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]" : "border-transparent hover:border-stone-200"} focus:border-stone-900 focus:bg-white rounded-lg px-3 py-2 text-sm transition-all outline-none pr-8`}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-300 text-[18px] pointer-events-none">
            expand_more
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-[9999] w-full min-w-[220px] mt-1 bg-white border border-stone-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto animate-fadeIn left-0">
            <div className="sticky top-0 bg-white p-2 border-b border-stone-100">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full bg-stone-50 border-none rounded-lg px-8 py-1.5 text-xs outline-none focus:ring-1 focus:ring-stone-200"
                  placeholder="Tìm nhanh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-[14px]">search</span>
              </div>
            </div>
            <div className="p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded-lg transition-colors flex items-center justify-between group"
                    onClick={() => handleSelect(opt)}
                  >
                    <span className="font-medium text-stone-700">{opt.name}</span>
                    <span className="text-[10px] text-stone-300 group-hover:text-stone-400 font-mono">{opt.code}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-[10px] text-stone-400 italic">Không tìm thấy.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    newVariants[index].isModified = true;
    setVariants(newVariants);
    if (duplicateIndices.length > 0) setDuplicateIndices([]);
    if (error && error.includes("Trùng biến thể")) setError("");
  };

  const addNewVariant = () => {
    setVariants([{
      color: '',
      size: '',
      stockQty: 0,
      salePrice: '',
      importPrice: '',
      isNew: true,
      isModified: true
    }, ...variants]);
  };

  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    if (!variant.color || !variant.size) {
      return setError("Vui lòng nhập đầy đủ Màu sắc và Kích cỡ.");
    }

    const isDuplicate = variants.some((v, idx) => 
      idx !== index && 
      v.color?.toLowerCase() === variant.color?.toLowerCase() && 
      v.size?.toLowerCase() === variant.size?.toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateIndices([index]);
      return setError(`Trùng biến thể: ${variant.color} - ${variant.size}`);
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        color: variant.color,
        size: variant.size,
        stockQty: Number(variant.stockQty) || 0,
        salePrice: variant.salePrice ? Number(variant.salePrice) : null,
        importPrice: variant.importPrice ? Number(variant.importPrice) : null
      };

      const method = variant.isNew ? 'POST' : 'PUT';
      const url = variant.isNew 
        ? `/api/v1/admin/products/${id}/variants`
        : `/api/v1/admin/products/${id}/variants/${variant.id}`;

      const response = await fetch(url, {
        method: method,
        headers: jsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const res = await parseResponseBody(response);

      if (response.ok) {
        setSuccess(`Đã lưu biến thể ${variant.color} - ${variant.size} thành công!`);
        await fetchVariants(pagination.currentPage);
      } else {
        setError(extractMessage(res, 'Lỗi khi lưu biến thể.'));
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVariant = async (index) => {
    const variant = variants[index];
    if (variant.isNew) {
      setVariants(variants.filter((_, i) => i !== index));
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa biến thể ${variant.color} - ${variant.size}?`)) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/products/${id}/variants/${variant.id}`, {
        method: 'DELETE',
        headers: jsonAuthHeaders()
      });

      if (response.ok) {
        setSuccess('Đã xóa biến thể thành công.');
        await fetchVariants(pagination.currentPage);
      } else {
        const res = await parseResponseBody(response);
        setError(extractMessage(res, 'Không thể xóa biến thể.'));
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStock = (index, newQty) => {
    handleVariantChange(index, "stockQty", newQty);
  };

  const handleSaveAll = async () => {
    const modifiedVariants = variants.filter(v => v.isModified);
    if (modifiedVariants.length === 0) {
      return alert("Không có thay đổi nào để lưu.");
    }

    setIsSaving(true);
    setError('');
    let hasError = false;

    for (const variant of modifiedVariants) {
        try {
            const payload = {
                color: variant.color,
                size: variant.size,
                stockQty: Number(variant.stockQty) || 0,
                salePrice: variant.salePrice ? Number(variant.salePrice) : null,
                importPrice: variant.importPrice ? Number(variant.importPrice) : null
            };
            const method = variant.isNew ? 'POST' : 'PUT';
            const url = variant.isNew 
                ? `/api/v1/admin/products/${id}/variants`
                : `/api/v1/admin/products/${id}/variants/${variant.id}`;

            const response = await fetch(url, {
                method: method,
                headers: jsonAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!response.ok) hasError = true;
        } catch (err) {
            hasError = true;
        }
    }

    if (hasError) {
        setError("Có lỗi xảy ra khi lưu một số biến thể. Vui lòng kiểm tra lại.");
    } else {
        setSuccess("Đã lưu tất cả thay đổi!");
        await fetchVariants(pagination.currentPage);
    }
    setIsSaving(false);
  };

  const summary = useMemo(() => {
    const totalVariants = pagination.totalElements;
    const totalStock = variants.reduce((sum, item) => sum + (Number(item.stockQty) || 0), 0);
    const activeVariants = variants.filter((item) => Number(item.stockQty) > 0).length;
    const lowStockVariants = variants.filter((item) => {
      const stock = Number(item.stockQty) || 0;
      return stock > 0 && stock < 10;
    }).length;

    return [
      { label: 'Tổng biến thể', value: totalVariants, icon: 'layers', color: 'bg-stone-900' },
      { label: 'Tổng tồn kho', value: totalStock, icon: 'inventory_2', color: 'bg-stone-600' },
      { label: 'Sẵn hàng', value: activeVariants, icon: 'check_circle', color: 'bg-emerald-600' },
    ];
  }, [variants, pagination.totalElements]);

  if (loading && variants.length === 0) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-stone-100 px-6">
        <div className="rounded-2xl border border-stone-200 bg-white px-8 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
          <p className="text-sm font-medium text-stone-500">Đang tải biến thể...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-stone-100 text-stone-800 font-sans h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/products/edit/${id}`)}
            className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900 leading-tight">Quản lý kho & Biến thể</h1>
            <p className="text-xs text-stone-500 mt-0.5">Sản phẩm: <span className="font-bold text-stone-800 uppercase tracking-tight">{product?.name}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addNewVariant}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm biến thể
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !variants.some(v => v.isModified)}
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition-all shadow-lg shadow-stone-200 flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">check</span>
            )}
            Lưu tất cả thay đổi
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-shake">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-emerald-100 animate-fadeIn">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary.map((item) => (
            <div key={item.label} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-stone-900">{item.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${item.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Filter Bar */}
        <section className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Màu sắc:</span>
            <AttributeSelector
              placeholder="Tất cả màu"
              value={filters.color}
              options={STANDARD_COLORS}
              onChange={(val) => handleFilterChange('color', val)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Size:</span>
            <AttributeSelector
              placeholder="Tất cả size"
              value={filters.size}
              options={STANDARD_SIZES}
              onChange={(val) => handleFilterChange('size', val)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[220px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sắp xếp:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 transition-all flex-1"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(filters.color || filters.size || filters.sortBy) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-bold text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Xóa lọc
            </button>
          )}
        </section>

        {/* Variants Table */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-400">reorder</span>
              <h2 className="text-sm font-bold text-stone-800">Danh sách các phiên bản chi tiết</h2>
            </div>
            {loading && <span className="text-[10px] text-stone-400 animate-pulse font-bold">Đang cập nhật danh sách...</span>}
          </div>

          <div className="overflow-x-auto pb-64 -mb-64">
            <table className="w-full text-left border-collapse relative z-10">

              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">SKU / ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Màu sắc</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Kích cỡ</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Giá nhập (đ)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Giá bán (đ)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 w-32 text-right pr-10">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {variants.map((variant, index) => {
                  const stockMeta = getStockMeta(variant.stockQty);
                  return (
                    <tr key={variant.id || `new-${index}`} className={`group hover:bg-stone-50/30 transition-all ${variant.isModified ? 'bg-amber-50/10' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-stone-600">{variant.sku || 'N/A'}</span>
                            <span className="text-[9px] text-stone-400 uppercase">{variant.isNew ? 'Mới' : `ID: ${variant.id?.substring(0, 8)}...`}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <AttributeSelector
                          placeholder="Màu sắc"
                          value={variant.color}
                          options={STANDARD_COLORS}
                          onChange={(val) => handleVariantChange(index, "color", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>
                      <td className="px-2 py-3 w-28">
                        <AttributeSelector
                          placeholder="Size"
                          value={variant.size}
                          options={STANDARD_SIZES}
                          onChange={(val) => handleVariantChange(index, "size", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>

                      <td className="px-2 py-3 w-24">
                        <input
                          className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-900 focus:bg-white rounded-lg px-3 py-2 text-sm text-center transition-all outline-none"
                          type="number"
                          placeholder="0"
                          value={variant.stockQty}
                          onChange={(e) => handleUpdateStock(index, e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-3 w-32">
                        <input
                          className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-900 focus:bg-white rounded-lg px-3 py-2 text-sm transition-all outline-none"
                          type="text"
                          placeholder="Giá nhập"
                          value={variant.importPrice ? Number(variant.importPrice).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            handleVariantChange(index, "importPrice", rawValue);
                          }}
                        />
                      </td>
                      <td className="px-2 py-3 w-32">
                        <input
                          className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-900 focus:bg-white rounded-lg px-3 py-2 text-sm transition-all outline-none"
                          type="text"
                          placeholder="Mặc định"
                          value={variant.salePrice ? Number(variant.salePrice).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            handleVariantChange(index, "salePrice", rawValue);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${stockMeta.tone}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dot}`}></span>
                          {stockMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right pr-10">
                        <div className="flex items-center justify-end gap-2">
                          {variant.isModified && (
                              <button
                                onClick={() => handleSaveVariant(index)}
                                disabled={isSaving}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm"
                                title="Lưu dòng này"
                              >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                              </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(index)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Xóa biến thể"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex justify-center">
            <button
              onClick={addNewVariant}
              className="text-xs font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Thêm dòng biến thể mới
            </button>
          </div>
        </section>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
                <button 
                    disabled={pagination.currentPage === 0 || loading}
                    onClick={() => fetchVariants(pagination.currentPage - 1)}
                    className="w-10 h-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-all"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800">
                    Trang {pagination.currentPage + 1} / {pagination.totalPages}
                </div>
                <button 
                    disabled={pagination.currentPage >= pagination.totalPages - 1 || loading}
                    onClick={() => fetchVariants(pagination.currentPage + 1)}
                    className="w-10 h-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-all"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        )}

        <div className="flex justify-end pt-4 pb-10">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !variants.some(v => v.isModified)}
            className="px-8 py-4 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 text-sm font-bold transition-all shadow-xl shadow-stone-200 flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Đang xử lý hệ thống..." : "Lưu tất cả biến thể đã sửa"}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminProductVariants;
