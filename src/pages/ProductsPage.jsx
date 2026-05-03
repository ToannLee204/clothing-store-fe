import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 12;

function formatPrice(value) {
  const price = Number(value ?? 0);
  return `${new Intl.NumberFormat('vi-VN').format(Number.isFinite(price) ? price : 0)}đ`;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
}

function normalizePagination(payload) {
  const base =
    payload && typeof payload === 'object' && ('meta' in payload || 'result' in payload)
      ? payload
      : payload?.data ?? payload;

  const meta = base?.meta ?? base?.data?.meta ?? null;
  const result = normalizeList(base);

  return { meta, result };
}

function getCategoryId(category) {
  return category?.id ?? category?.maDanhMuc ?? category?.categoryId ?? '';
}

function getCategoryName(category) {
  return category?.name ?? category?.ten ?? category?.categoryName ?? 'Danh mục';
}

function getCategoryChildren(category) {
  if (Array.isArray(category?.children)) return category.children;
  if (Array.isArray(category?.subCategories)) return category.subCategories;
  return [];
}

function getProductId(product) {
  return product?.id ?? product?.maSP ?? product?.productId ?? '';
}

function getProductName(product) {
  return product?.name ?? product?.ten ?? product?.productName ?? 'Sản phẩm';
}

function getProductThumbnail(product) {
  return (
    product?.thumbnailUrl ??
    product?.imageUrl ??
    product?.anhDaiDien ??
    'https://via.placeholder.com/400x600?text=No+Image'
  );
}

function getProductPrice(product) {
  return product?.basePrice ?? product?.price ?? product?.gia ?? 0;
}

function getProductCategoryName(product) {
  return product?.categoryName ?? product?.category?.name ?? product?.tenDanhMuc ?? '';
}

function getProductDescription(product) {
  return product?.description ?? product?.moTa ?? '';
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 0 0-13.3-3M4 15a8 8 0 0 0 13.3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');

  const [expandedCats, setExpandedCats] = useState(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const priceRanges = useMemo(
    () => ({
      all: { label: 'Tất cả', minPrice: null, maxPrice: null },
      under500k: { label: 'Dưới 500k', minPrice: 0, maxPrice: 500000 },
      from500kTo1m: { label: '500k - 1tr', minPrice: 500000, maxPrice: 1000000 },
      over1m: { label: 'Trên 1tr', minPrice: 1000000, maxPrice: null }
    }),
    []
  );

  const toggleCategory = (id) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(String(categoryId));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategoryId('');
    setPriceRange('all');
    setSortBy('newest');
    setSearchInput('');
    setKeyword('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/v1/categories');
        if (!res.ok) return;

        const payload = await res.json();
        const categoryList = normalizeList(payload);
        setCategories(categoryList);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setPageLoading(true);
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        params.set('page', String(currentPage - 1));
        params.set('pageSize', String(PAGE_SIZE));
        params.set('status', '1');

        if (keyword) params.set('keyword', keyword);
        if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
        if (sortBy) params.set('sortBy', sortBy);

        const range = priceRanges[priceRange] ?? priceRanges.all;
        if (range.minPrice !== null) params.set('minPrice', String(range.minPrice));
        if (range.maxPrice !== null) params.set('maxPrice', String(range.maxPrice));

        const res = await fetch(`/api/v1/products?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Không thể tải sản phẩm từ backend');
        }

        const payload = await res.json();
        const { meta, result } = normalizePagination(payload);

        setProducts(result);
        setTotalPages(meta?.pages ?? 1);
        setTotalCount(meta?.totals ?? result.length);
      } catch (err) {
        console.error('Lỗi kết nối API:', err);
        setProducts([]);
        setTotalPages(1);
        setTotalCount(0);
        setError('Không thể tải danh sách sản phẩm từ backend.');
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, keyword, priceRange, priceRanges, selectedCategoryId, sortBy]);

  const renderCategoryTree = (nodes, level = 0) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;

    return (
      <ul className={`space-y-2 ${level > 0 ? 'ml-6 mt-2 border-l border-slate-100 pl-3' : ''}`}>
        {nodes.map((cat) => {
          const catId = getCategoryId(cat);
          const catName = getCategoryName(cat);
          const children = getCategoryChildren(cat);
          const hasChildren = children.length > 0;
          const isExpanded = expandedCats.has(String(catId));
          const isSelected = String(selectedCategoryId) === String(catId);

          return (
            <li key={String(catId)}>
              <div className="flex items-center justify-between gap-3 group">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="category"
                    checked={isSelected}
                    onChange={() => handleSelectCategory(catId)}
                    className="h-4 w-4 border-slate-300 text-[#ec5b13] focus:ring-[#ec5b13]"
                  />
                  <span
                    className={`text-sm transition-colors group-hover:text-[#ec5b13] ${
                      level === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-500'
                    }`}
                  >
                    {catName}
                  </span>
                </label>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(String(catId))}
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#ec5b13]"
                    aria-label="Expand category"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    >
                      chevron_right
                    </span>
                  </button>
                ) : null}
              </div>

              {hasChildren && isExpanded ? renderCategoryTree(children, level + 1) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.2rem] text-white">
              Bộ sưu tập sản phẩm
            </span>
            <h1 className="font-headline text-4xl font-black tracking-tight text-slate-950">
              Khám phá sản phẩm 
            </h1>
          </div>

          <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            {totalCount} kết quả
          </div>
        </div>

        <div className="mb-10 grid gap-4 rounded-[2rem] bg-slate-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:p-5">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d95210]"
            >
              Tìm
            </button>
          </form>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name">Tên A-Z</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-[#ec5b13] hover:text-[#ec5b13]"
          >
            <ResetIcon />
            Xoá lọc
          </button>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-72">
            <div className="sticky top-6 space-y-10 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
                  <span className="material-symbols-outlined">filter_alt</span>
                  Bộ lọc
                </h2>

                <div className="mb-8">
                  <div className="mb-4 text-xs font-black uppercase tracking-[0.18rem] text-slate-400">
                    Danh mục
                  </div>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`mb-4 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      !selectedCategoryId
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-[#ec5b13] hover:text-[#ec5b13]'
                    }`}
                  >
                    Tất cả
                  </button>

                  {categories.length > 0 ? (
                    renderCategoryTree(categories)
                  ) : (
                    <p className="text-sm italic text-slate-400">Đang tải danh mục...</p>
                  )}
                </div>

                <div>
                  <div className="mb-4 text-xs font-black uppercase tracking-[0.18rem] text-slate-400">
                    Khoảng giá
                  </div>
                  <div className="space-y-3">
                    {Object.entries(priceRanges).map(([key, item]) => (
                      <label key={key} className="flex cursor-pointer items-center gap-3 group">
                        <input
                          type="radio"
                          name="price"
                          checked={priceRange === key}
                          onChange={() => {
                            setPriceRange(key);
                            setCurrentPage(1);
                          }}
                          className="h-4 w-4 border-slate-300 text-[#ec5b13] focus:ring-[#ec5b13]"
                        />
                        <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-[#ec5b13]">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1">
            {error ? (
              <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Sản phẩm mới</h2>
              </div>

              <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400">
                Trang {currentPage} / {totalPages}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] bg-slate-50 text-center font-bold text-slate-400">
                Đang tải dữ liệu từ backend...
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-center">
                <span className="material-symbols-outlined mb-4 text-6xl text-slate-200">
                  shopping_bag
                </span>
                <h3 className="text-lg font-bold text-slate-950">Không có sản phẩm phù hợp</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Hãy thử xoá bộ lọc, đổi từ khoá hoặc kiểm tra lại dữ liệu phía backend.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ec5b13]"
                >
                  <ResetIcon />
                  Xoá bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const id = getProductId(product);
                    const name = getProductName(product);
                    const image = getProductThumbnail(product);
                    const price = getProductPrice(product);
                    const categoryName = getProductCategoryName(product);
                    const description = getProductDescription(product);

                    return (
                      <Link
                        to={`/product/${id}`}
                        key={String(id)}
                        className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                          <img
                            src={image}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt={name}
                          />
                          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18rem] text-[#ec5b13] shadow-sm">
                            {product?.status === 1 ? 'Đang bán' : 'Mới về'}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform group-hover:translate-y-0">
                            <div className="rounded-2xl bg-white/90 px-4 py-3 text-center text-sm font-bold shadow-xl backdrop-blur">
                              Xem chi tiết
                            </div>
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18rem] text-[#ec5b13]">
                            {categoryName || 'Danh mục'}
                          </p>
                          <h3 className="mt-2 line-clamp-1 text-base font-bold text-slate-950 transition-colors group-hover:text-[#ec5b13]">
                            {name}
                          </h3>
                          {description ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {description}
                            </p>
                          ) : null}
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <p className="text-lg font-black text-slate-950">{formatPrice(price)}</p>
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#ec5b13]">
                              Chi tiết
                              <ArrowIcon />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || pageLoading}
                      onClick={() => goToPage(currentPage - 1)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#ec5b13] hover:text-[#ec5b13]"
                    >
                      Trang trước
                    </button>

                    <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                      {currentPage}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages || pageLoading}
                      onClick={() => goToPage(currentPage + 1)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#ec5b13] hover:text-[#ec5b13]"
                    >
                      Trang sau
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
