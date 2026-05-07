import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminAddProduct.css";

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    categoryId: "",
    basePrice: "",
    description: "",
    status: 1,
  });

  const [variants, setVariants] = useState([
    { sku: "", color: "", size: "", stockQty: "", salePrice: "" },
  ]);

  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // { file, preview }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/v1/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await response.text();
        if (response.ok && text) {
          const actualData = JSON.parse(text);
          setCategories(actualData.data || actualData || []);
        }
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
      }
    };
    fetchCategories();
  }, [token]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // VARIANTS
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };
  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: "", color: "", size: "", stockQty: "", salePrice: "" },
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

    setLoading(true);
    try {
      const productPayload = {
        ...productData,
        basePrice: Number(productData.basePrice),
        variants: variants.map((v) => ({
          ...v,
          stockQty: Number(v.stockQty) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : null,
        })),
      };

      const formData = new FormData();
      formData.append(
        "product",
        new Blob([JSON.stringify(productPayload)], {
          type: "application/json",
        }),
      );

      // Append thumbnail file nếu có
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      // Append gallery files nếu có
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
    <main className="flex-1 overflow-y-auto bg-stone-100 text-stone-800 font-sans">
      {/* Top header bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-stone-900 leading-tight tracking-tight">
              Thêm sản phẩm mới
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Tạo sản phẩm mới cho hệ thống Clothing Store
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
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  sync
                </span>{" "}
                Đang lưu...
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Lưu sản phẩm
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-100">
            <span className="material-symbols-outlined text-lg">error</span>{" "}
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* LEFT — main column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Thông tin cơ bản */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b5bdb"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">
                Thông tin cơ bản
              </h2>
            </div>

            <div className="space-y-4">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">
                  Tên sản phẩm <span className="text-red-400">*</span>
                </label>
                <input
                  className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all"
                  type="text"
                  placeholder="Vd: Áo khoác Bomber Minimalist..."
                  value={productData.name}
                  onChange={(e) =>
                    setProductData({ ...productData, name: e.target.value })
                  }
                />
              </div>

              {/* Danh mục + Giá */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">
                    Danh mục <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white transition-all cursor-pointer"
                    value={productData.categoryId}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        categoryId: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      -- Chọn danh mục --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">
                    Giá niêm yết (VNĐ) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="field-input w-full px-3.5 py-2.5 pr-8 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all"
                      type="text"
                      placeholder="0"
                      value={productData.basePrice ? Number(productData.basePrice).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setProductData({
                          ...productData,
                          basePrice: rawValue,
                        });
                      }}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-600 pointer-events-none font-medium">
                      đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">
                  Mô tả sản phẩm
                </label>
                <textarea
                  className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none leading-relaxed"
                  rows="4"
                  placeholder="Chất liệu, kiểu dáng, xuất xứ..."
                  value={productData.description}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      description: e.target.value,
                    })
                  }
                ></textarea>
                <p className="text-xs text-stone-500 mt-1.5">
                  Mô tả chi tiết giúp khách hàng ra quyết định mua hàng dễ hơn.
                </p>
              </div>
            </div>
          </section>

          {/* Hình ảnh sản phẩm */}
          <section className="card-section bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b5bdb"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-stone-800">
                  Hình ảnh sản phẩm
                </h2>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-2.5">
                Ảnh đại diện (Thumbnail) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4 items-start">
                {!thumbnailPreview ? (
                  <label className="upload-zone cursor-pointer w-28 h-28 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 transition-all bg-stone-50">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailSelect}
                    />
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-xs font-medium text-stone-600">
                      Chọn ảnh
                    </span>
                    <span className="text-xs text-stone-500">
                      JPG, PNG, WEBP
                    </span>
                  </label>
                ) : (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-200 group">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="text-white hover:text-red-400 p-2"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 text-xs text-stone-600 leading-relaxed pt-1">
                  <p className="font-medium text-stone-600 mb-1">
                    Ảnh đại diện sản phẩm
                  </p>
                  <p>
                    Kích thước khuyến nghị:{" "}
                    <span className="font-medium text-stone-600">
                      800 × 800px
                    </span>
                  </p>
                  <p>
                    Dung lượng tối đa:{" "}
                    <span className="font-medium text-stone-600">5 MB</span>
                  </p>
                  <p className="mt-1.5 text-stone-500">
                    Ảnh chất lượng cao giúp tăng tỉ lệ chuyển đổi.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest">
                  Bộ sưu tập ảnh phụ (Gallery)
                </label>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Thêm ảnh
                </button>
              </div>

              {imageFiles.length === 0 ? (
                <label className="upload-zone cursor-pointer w-full rounded-xl border-2 border-dashed border-stone-200 py-7 flex flex-col items-center gap-2 transition-all bg-stone-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    ref={galleryInputRef}
                    onChange={handleGallerySelect}
                  />
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a8a29e"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm font-medium text-stone-600">
                    Bấm để chọn ảnh từ máy tính
                  </span>
                  <span className="text-xs text-stone-500">
                    Có thể chọn nhiều ảnh cùng lúc
                  </span>
                </label>
              ) : (
                <div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    ref={galleryInputRef}
                    onChange={handleGallerySelect}
                  />
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {imageFiles.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group"
                      >
                        <img
                          src={img.preview}
                          alt={`Gallery ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="text-white hover:text-red-400 p-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-600 hover:text-brand-500 hover:bg-brand-50 hover:border-brand-300 transition-all cursor-pointer"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="text-xs mt-1 font-medium">Thêm ảnh</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT — sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* Trạng thái */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b6d11"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">
                Trạng thái
              </h2>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 pointer-events-none z-10"></span>
              <select
                className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-800 cursor-pointer appearance-none transition-all hover:border-green-300"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%233b6d11' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
                value={productData.status}
                onChange={(e) =>
                  setProductData({ ...productData, status: e.target.value })
                }
              >
                <option value="1">Kích hoạt (Hiển thị ngay)</option>
                <option value="0">Nháp (Ẩn khỏi cửa hàng)</option>
              </select>
            </div>
            <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
              Sản phẩm sẽ hiển thị ngay trên cửa hàng sau khi lưu.
            </p>
          </section>

          {/* Biến thể */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b5bdb"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">
                Biến thể (Variants)
              </h2>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="variant-item bg-stone-50 rounded-xl border border-stone-100 p-3.5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">
                      Biến thể {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="w-5 h-5 rounded flex items-center justify-center text-stone-500 hover:text-red-400 hover:bg-red-50 transition-all"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                        Màu sắc
                      </label>
                      <input
                        className="field-input w-full px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder-stone-400 bg-white transition-all"
                        type="text"
                        placeholder="Trắng, Đen..."
                        value={variant.color}
                        onChange={(e) =>
                          handleVariantChange(index, "color", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                        Kích cỡ
                      </label>
                      <input
                        className="field-input w-full px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder-stone-400 bg-white transition-all"
                        type="text"
                        placeholder="S, M, L..."
                        value={variant.size}
                        onChange={(e) =>
                          handleVariantChange(index, "size", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                      Mã SKU <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="field-input w-full px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder-stone-400 bg-white font-mono transition-all"
                      type="text"
                      placeholder="SKU-XXXX"
                      value={variant.sku}
                      onChange={(e) =>
                        handleVariantChange(index, "sku", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                        Tồn kho
                      </label>
                      <input
                        className="field-input w-full px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white transition-all"
                        type="number"
                        value={variant.stockQty}
                        onChange={(e) =>
                          handleVariantChange(index, "stockQty", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                        Giá sale
                      </label>
                      <input
                        className="field-input w-full px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder-stone-400 bg-white transition-all"
                        type="text"
                        placeholder="Trống = ko sale"
                        value={variant.salePrice ? Number(variant.salePrice).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          handleVariantChange(
                            index,
                            "salePrice",
                            rawValue
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-stone-200 text-xs font-medium text-stone-600 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-1.5"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Thêm biến thể khác
            </button>
          </section>

          {/* Ghi chú nội bộ */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-stone-800">
                Ghi chú nội bộ
              </h2>
            </div>
            <textarea
              className="field-input w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-white transition-all resize-none leading-relaxed"
              rows="3"
              placeholder="Ghi chú riêng cho team, không hiển thị ra ngoài..."
            ></textarea>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminAddProduct;
