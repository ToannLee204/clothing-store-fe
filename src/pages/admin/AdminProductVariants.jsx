import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const token = localStorage.getItem('token');

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  
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

  const [availableColors, setAvailableColors] = useState(STANDARD_COLORS);
  const [availableSizes, setAvailableSizes] = useState(STANDARD_SIZES);
  const [loading, setLoading] = useState(true);
  const [duplicateIndices, setDuplicateIndices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const API_URL = `/api/v1/admin/products/${id}`;

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(API_URL, { headers });
      const res = await response.json();
      if (response.ok && res.data) {
        setProduct(res.data);
        setVariants(res.data.variants || []);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
      setError('Không thể tải dữ liệu biến thể.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Searchable Dropdown Component
  const AttributeSelector = ({ value, onChange, options, placeholder, isError }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    React.useEffect(() => {
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

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    return (
      <div className={`relative ${isOpen ? "z-[100]" : "z-0"}`} ref={containerRef}>
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
                  onKeyDown={handleKeyDown}
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
                  <p className="text-[10px] text-stone-400 italic">Không tìm thấy. Bạn có thể tự nhập.</p>
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
    setVariants(newVariants);
    if (duplicateIndices.length > 0) setDuplicateIndices([]);
    if (error.startsWith("Trùng biến thể")) setError("");
  };

  const addVariant = () => {
    setVariants([...variants, { color: '', size: '', stockQty: 0, salePrice: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return alert('Phải có ít nhất 1 biến thể!');
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    // Kiểm tra trùng lặp biến thể (Màu sắc + Kích cỡ)
    const variantMap = new Map();
    const dups = [];
    variants.forEach((v, idx) => {
      if (!v.color || !v.size) return;
      const key = `${v.color.trim().toLowerCase()}-${v.size.trim().toLowerCase()}`;
      if (variantMap.has(key)) {
        dups.push(variantMap.get(key));
        dups.push(idx);
      } else {
        variantMap.set(key, idx);
      }
    });

    if (dups.length > 0) {
      setDuplicateIndices(dups);
      const firstDup = variants[dups[1]];
      return setError(`Trùng biến thể: color=${firstDup.color}, size=${firstDup.size}. Vui lòng kiểm tra lại!`);
    }
    setDuplicateIndices([]);

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        name: product.name,
        categoryId: product.category?.id || product.categoryId,
        description: product.description,
        basePrice: product.basePrice,
        status: product.status,
        thumbnailUrl: product.thumbnailUrl,
        imageUrls: product.imageUrls || [],
        variants: variants.map((v) => ({
          color: v.color,
          size: v.size,
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
        alert('Đã lưu tất cả thay đổi!');
        await fetchData();
      } else {
        const text = await response.text();
        setError('Lỗi khi lưu: ' + text);
      }
    } catch {
      setError('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
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
      { label: 'Tổng biến thể', value: totalVariants, icon: 'layers', color: 'bg-stone-900' },
      { label: 'Tổng tồn kho', value: totalStock, icon: 'inventory_2', color: 'bg-stone-600' },
      { label: 'Sẵn hàng', value: activeVariants, icon: 'check_circle', color: 'bg-emerald-600' },
      { label: 'Sắp hết hàng', value: lowStockVariants, icon: 'warning', color: 'bg-amber-500' },
    ];
  }, [variants]);

  if (loading) {
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
            onClick={addVariant}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm biến thể
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
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
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Variants Table */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-400">reorder</span>
              <h2 className="text-sm font-bold text-stone-800">Danh sách các phiên bản chi tiết</h2>
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Tự động đồng bộ với kho hàng</p>
          </div>

          <div className="overflow-x-auto pb-64 -mb-64">
            <table className="w-full text-left border-collapse relative z-10">

              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Màu sắc</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Kích cỡ</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Giá bán riêng (đ)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {variants.map((variant, index) => {
                  const stockMeta = getStockMeta(variant.stockQty);
                  return (
                    <tr key={index} className="group hover:bg-stone-50/30 transition-all">
                      <td className="px-4 py-3">
                        <AttributeSelector
                          placeholder="Màu sắc"
                          value={variant.color}
                          options={availableColors}
                          onChange={(val) => handleVariantChange(index, "color", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>
                      <td className="px-4 py-3 w-28">
                        <AttributeSelector
                          placeholder="Size"
                          value={variant.size}
                          options={availableSizes}
                          onChange={(val) => handleVariantChange(index, "size", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>

                      <td className="px-4 py-3 w-24">
                        <input
                          className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-900 focus:bg-white rounded-lg px-3 py-2 text-sm text-center transition-all outline-none"
                          type="number"
                          placeholder="0"
                          value={variant.stockQty}
                          onChange={(e) => handleVariantChange(index, "stockQty", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 w-40">
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
                      <td className="px-4 py-3 text-center">
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex justify-center">
            <button
              onClick={addVariant}
              className="text-xs font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Thêm dòng biến thể mới
            </button>
          </div>
        </section>

        <div className="flex justify-end pt-4 pb-10">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-8 py-4 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 text-sm font-bold transition-all shadow-xl shadow-stone-200 flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Đang lưu hệ thống..." : "Xác nhận & Cập nhật kho hàng"}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminProductVariants;
