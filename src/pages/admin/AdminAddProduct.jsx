import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminAddProduct.css";

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  
  // Dữ liệu chuẩn từ Backend Enums
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
  const [error, setError] = useState("");
  const [duplicateIndices, setDuplicateIndices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    categoryId: "",
    basePrice: "",
    description: "",
    status: 1,
    internalNotes: "",
  });

  const [variants, setVariants] = useState([
    { color: "", size: "", stockQty: "", salePrice: "", importPrice: "" },
  ]);

  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // { file, preview }

  // Helper to flatten category tree
  const flattenCategories = (categoriesTree, prefix = "") => {
    let flatList = [];
    categoriesTree.forEach((cat) => {
      flatList.push({
        ...cat,
        displayName: prefix + cat.name,
      });
      if (cat.children && cat.children.length > 0) {
        flatList = flatList.concat(flattenCategories(cat.children, prefix + "— "));
      }
    });
    return flatList;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch Categories
        const catRes = await fetch("/api/v1/categories", { headers });
        if (catRes.ok) {
          const data = await catRes.json();
          const rawItems = data.result || data.data?.result || data.data || data || [];
          const flatData = flattenCategories(Array.isArray(rawItems) ? rawItems : []);
          setCategories(flatData);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu thuộc tính:", err);
      }
    };
    fetchData();
  }, [token]);

  // Searchable Dropdown Component
  const AttributeSelector = ({ value, onChange, options, placeholder, isError }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

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
            className={`w-full bg-white border ${isError ? "border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]" : "border-stone-200"} rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 transition-all pr-8`}
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [thumbnailPreview, imageFiles]);

  // VARIANTS
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
    if (duplicateIndices.length > 0) setDuplicateIndices([]);
    if (error.startsWith("Trùng biến thể")) setError("");
  };
  const addVariant = () => {
    setVariants([
      ...variants,
      { color: "", size: "", stockQty: "", salePrice: "", importPrice: "" },
    ]);
  };
  const removeVariant = (index) => {
    if (variants.length === 1) return alert("Phải có ít nhất 1 biến thể!");
    setVariants(variants.filter((_, i) => i !== index));
  };

  // THUMBNAIL FILE
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };
  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  // GALLERY FILES
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageFiles((prev) => [...prev, ...newImages]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };
  const removeGalleryImage = (index) => {
    setImageFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // SUBMIT — multipart/form-data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !productData.name ||
      !productData.categoryId ||
      !productData.basePrice
    ) {
      return setError("Vui lòng điền đủ Tên, Danh mục và Giá cơ bản!");
    }

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

    setLoading(true);
    try {
      const productPayload = {
        ...productData,
        basePrice: Number(productData.basePrice),
        variants: variants.map((v) => ({
          color: v.color,
          size: v.size,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          importPrice: v.importPrice ? Number(v.importPrice) : null,
        })),
      };

      const formData = new FormData();
      formData.append(
        "product",
        new Blob([JSON.stringify(productPayload)], {
          type: "application/json",
        }),
      );

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      if (imageFiles.length > 0) {
        imageFiles.forEach((img) => {
          formData.append("images", img.file);
        });
      }

      const response = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let resData = {};
      try {
        resData = JSON.parse(text);
      } catch (e) {}

      if (response.ok) {
        alert("Thêm sản phẩm thành công!");
        navigate("/admin/products");
      } else {
        setError(resData.message || "Lỗi khi thêm sản phẩm từ Server");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối đến Backend!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-stone-100 text-stone-800 font-sans h-screen">
      {/* Top header bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-stone-900 leading-tight tracking-tight">
              Thêm sản phẩm mới
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Thiết lập sản phẩm và các biến thể phân loại
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Đang lưu...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">save</span> Lưu sản phẩm</>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-100">
            <span className="material-symbols-outlined text-lg">error</span> {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT — main column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Thông tin cơ bản */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Thông tin cơ bản</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  Tên sản phẩm <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all outline-none focus:border-stone-900"
                  type="text"
                  placeholder="Vd: Áo khoác Bomber Minimalist..."
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                    Danh mục <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white transition-all cursor-pointer outline-none focus:border-stone-900 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a8a29e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    value={productData.categoryId}
                    onChange={(e) => setProductData({ ...productData, categoryId: e.target.value })}
                  >
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.displayName || cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                    Giá niêm yết (VNĐ) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all outline-none focus:border-stone-900"
                      type="text"
                      placeholder="0"
                      value={productData.basePrice ? Number(productData.basePrice).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setProductData({ ...productData, basePrice: rawValue });
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold">đ</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  Mô tả sản phẩm
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none leading-relaxed outline-none focus:border-stone-900"
                  rows="4"
                  placeholder="Chất liệu, kiểu dáng, xuất xứ..."
                  value={productData.description}
                  onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                ></textarea>
              </div>
            </div>
          </section>

          {/* Hình ảnh sản phẩm */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">image</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Hình ảnh sản phẩm</h2>
            </div>

            {/* Thumbnail */}
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                Ảnh đại diện (Thumbnail) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-6 items-start">
                {!thumbnailPreview ? (
                  <label className="upload-zone cursor-pointer w-32 h-32 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 transition-all bg-stone-50 hover:bg-stone-100 hover:border-stone-300 group">
                    <input type="file" className="hidden" accept="image/*" ref={thumbnailInputRef} onChange={handleThumbnailSelect} />
                    <span className="material-symbols-outlined text-stone-300 group-hover:text-stone-400 text-[32px]">add_a_photo</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Chọn ảnh</span>
                  </label>
                ) : (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-stone-200 group shadow-md">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={removeThumbnail} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hover:bg-red-500 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 text-xs text-stone-500 leading-relaxed pt-2">
                  <p className="font-bold text-stone-700 mb-1">Quy định về hình ảnh</p>
                  <ul className="list-disc list-inside space-y-1 text-stone-400">
                    <li>Kích thước tối thiểu 800x800px</li>
                    <li>Định dạng JPG, PNG hoặc WEBP</li>
                    <li>Dung lượng không quá 5MB mỗi file</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Bộ sưu tập ảnh (Gallery)
                </label>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-[11px] font-bold text-stone-900 hover:text-stone-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Thêm ảnh
                </button>
              </div>

              <input type="file" className="hidden" accept="image/*" multiple ref={galleryInputRef} onChange={handleGallerySelect} />

              {imageFiles.length === 0 ? (
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="cursor-pointer w-full rounded-2xl border-2 border-dashed border-stone-200 py-10 flex flex-col items-center gap-3 transition-all bg-stone-50 hover:bg-stone-100 hover:border-stone-300 group"
                >
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-stone-400 text-[40px]">collections</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-stone-500">Kéo thả hoặc bấm để chọn ảnh</p>
                    <p className="text-[11px] text-stone-400 mt-1">Nên có ít nhất 3-4 ảnh chi tiết sản phẩm</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {imageFiles.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group shadow-sm">
                      <img src={img.preview} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeGalleryImage(idx)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white hover:bg-red-500 transition-all flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-300 transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">add</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Thêm</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="card-section bg-white rounded-2xl border border-stone-200 p-6 shadow-sm min-h-[450px]">

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-800">Biến thể sản phẩm</h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">Màu sắc, kích cỡ, SKU và tồn kho riêng biệt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Thêm dòng
              </button>
            </div>

            <div className="overflow-x-auto -mx-2 pb-60 -mb-60">
              <table className="w-full text-left border-collapse min-w-[600px] relative z-10">

                <thead>
                  <tr className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <th className="px-4 py-3 border-b border-stone-100">Màu sắc</th>
                    <th className="px-4 py-3 border-b border-stone-100">Kích cỡ</th>
                    <th className="px-4 py-3 border-b border-stone-100 text-center">Tồn kho</th>
                    <th className="px-4 py-3 border-b border-stone-100">Giá nhập (đ)</th>
                    <th className="px-4 py-3 border-b border-stone-100">Giá sale (đ)</th>
                    <th className="px-4 py-3 border-b border-stone-100 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {variants.map((variant, index) => (
                    <tr key={index} className="group hover:bg-stone-50/50 transition-colors">
                      <td className="px-2 py-3">
                        <AttributeSelector
                          placeholder="Vd: Đen"
                          value={variant.color}
                          options={availableColors}
                          onChange={(val) => handleVariantChange(index, "color", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>
                      <td className="px-2 py-3 w-24">
                        <AttributeSelector
                          placeholder="M"
                          value={variant.size}
                          options={availableSizes}
                          onChange={(val) => handleVariantChange(index, "size", val)}
                          isError={duplicateIndices.includes(index)}
                        />
                      </td>

                      <td className="px-2 py-3 w-28">
                        <input
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-stone-900 transition-all"
                          type="number"
                          placeholder="0"
                          value={variant.stockQty}
                          onChange={(e) => handleVariantChange(index, "stockQty", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-3 w-32">
                        <input
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 transition-all"
                          type="text"
                          placeholder="0"
                          value={variant.importPrice ? Number(variant.importPrice).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            handleVariantChange(index, "importPrice", rawValue);
                          }}
                        />
                      </td>
                      <td className="px-2 py-3 w-36">
                        <input
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 transition-all"
                          type="text"
                          placeholder="Mặc định"
                          value={variant.salePrice ? Number(variant.salePrice).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            handleVariantChange(index, "salePrice", rawValue);
                          }}
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="mt-6 w-full py-4 rounded-xl border-2 border-dashed border-stone-100 text-xs font-bold text-stone-400 hover:text-stone-900 hover:border-stone-300 hover:bg-stone-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm một biến thể mới
            </button>
          </section>

          {/* Ghi chú nội bộ */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm relative z-0">

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Ghi chú nội bộ</h2>
            </div>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none outline-none focus:border-stone-900 leading-relaxed"
              rows="3"
              placeholder="Ghi chú riêng cho nhân viên quản lý, không hiển thị cho khách hàng..."
              value={productData.internalNotes}
              onChange={(e) => setProductData({ ...productData, internalNotes: e.target.value })}
            ></textarea>
          </section>
        </div>

        {/* RIGHT — sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Trạng thái */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <h2 className="text-sm font-bold text-stone-800">Trạng thái xuất bản</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-800 cursor-pointer appearance-none transition-all hover:border-stone-900 focus:border-stone-900 outline-none"
                  value={productData.status}
                  onChange={(e) => setProductData({ ...productData, status: e.target.value })}
                >
                  <option value="1">Kích hoạt (Hoạt động)</option>
                  <option value="0">Bản nháp (Lưu trữ)</option>
                </select>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${Number(productData.status) === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-stone-300'}`}></span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 pointer-events-none">expand_more</span>
              </div>
              
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">lightbulb</span>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Sản phẩm <span className="font-bold text-stone-700">Kích hoạt</span> sẽ hiển thị công khai trên website ngay sau khi lưu.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mẹo nhỏ */}
          <section className="bg-stone-900 rounded-2xl p-7 text-white overflow-hidden relative shadow-xl">
            <div className="relative z-10">
              <h3 className="text-[11px] font-bold mb-4 flex items-center gap-2 uppercase tracking-[0.2em] text-amber-400">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Mẹo tối ưu
              </h3>
              <ul className="text-xs text-stone-400 space-y-4 leading-relaxed">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white shrink-0">1</span>
                  <span>Tên sản phẩm nên chứa từ khóa tìm kiếm phổ biến.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white shrink-0">2</span>
                  <span>Hình ảnh có nền trắng giúp sản phẩm trông chuyên nghiệp hơn.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white shrink-0">3</span>
                  <span>Thiết lập giá sale hợp lý để tăng tỷ lệ chuyển đổi.</span>
                </li>
              </ul>
            </div>
            <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[140px] text-white/5 rotate-12 pointer-events-none">inventory</span>
          </section>

          <div className="p-2 border border-stone-200 rounded-2xl border-dashed">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Lưu & Hoàn tất"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminAddProduct;
