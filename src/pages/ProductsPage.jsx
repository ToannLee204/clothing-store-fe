import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/format';

const PAGE_SIZE = 12;

function formatPrice(value) {
  const price = Number(value ?? 0);
  return `${new Intl.NumberFormat('vi-VN').format(Number.isFinite(price) ? price : 0)}₫`;
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
  const base = payload && typeof payload === 'object' && ('meta' in payload || 'result' in payload)
      ? payload : payload?.data ?? payload;
  const meta = base?.meta ?? base?.data?.meta ?? null;
  const result = normalizeList(base);
  return { meta, result };
}

function getCategoryId(category) { return category?.id ?? category?.maDanhMuc ?? category?.categoryId ?? ''; }
function getCategoryName(category) { return category?.name ?? category?.ten ?? category?.categoryName ?? 'Danh mục'; }
function getCategoryChildren(category) { return Array.isArray(category?.children) ? category.children : (Array.isArray(category?.subCategories) ? category.subCategories : []); }

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

  const priceRanges = useMemo(() => ({
    all: { label: 'Tất cả sản phẩm', minPrice: null, maxPrice: null },
    under500k: { label: 'Dưới 500.000₫', minPrice: 0, maxPrice: 500000 },
    from500kTo1m: { label: '500.000₫ - 1.000.000₫', minPrice: 500000, maxPrice: 1000000 },
    over1m: { label: 'Trên 1.000.000₫', minPrice: 1000000, maxPrice: null }
  }), []);

  const toggleCategory = (id) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/v1/categories');
        if (res.ok) {
          const payload = await res.json();
          setCategories(normalizeList(payload));
        }
      } catch (err) { console.error('Lỗi tải danh mục:', err); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setPageLoading(true);
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(currentPage - 1),
          pageSize: String(PAGE_SIZE),
          status: '1'
        });
        if (keyword) params.set('keyword', keyword);
        if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
        if (sortBy) params.set('sortBy', sortBy);
        const range = priceRanges[priceRange] ?? priceRanges.all;
        if (range.minPrice !== null) params.set('minPrice', String(range.minPrice));
        if (range.maxPrice !== null) params.set('maxPrice', String(range.maxPrice));

        const res = await fetch(`/api/v1/products?${params.toString()}`);
        if (!res.ok) throw new Error('Không thể tải sản phẩm.');
        const payload = await res.json();
        const { meta, result } = normalizePagination(payload);
        setProducts(result);
        setTotalPages(meta?.pages ?? 1);
        setTotalCount(meta?.totals ?? result.length);
      } catch (err) {
        setError('Có lỗi xảy ra khi tải danh sách sản phẩm.');
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, keyword, priceRange, selectedCategoryId, sortBy, priceRanges]);

  const renderCategoryTree = (nodes, level = 0) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    return (
      <ul className={`space-y-3 ${level > 0 ? 'ml-4 mt-3 border-l border-slate-100 pl-4' : ''}`}>
        {nodes.map((cat) => {
          const catId = getCategoryId(cat);
          const children = getCategoryChildren(cat);
          const hasChildren = children.length > 0;
          const isExpanded = expandedCats.has(String(catId));
          const isSelected = String(selectedCategoryId) === String(catId);

          return (
            <li key={catId}>
              <div className="flex items-center justify-between group">
                <button
                  onClick={() => { setSelectedCategoryId(String(catId)); setCurrentPage(1); }}
                  className={`text-sm text-left transition-all ${isSelected ? 'text-[#0066A2] font-bold' : 'text-slate-500 hover:text-[#0066A2]'}`}
                >
                  {getCategoryName(cat)}
                </button>
                {hasChildren && (
                  <button onClick={() => toggleCategory(String(catId))} className="text-slate-400 hover:text-[#0066A2]">
                    <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
                  </button>
                )}
              </div>
              {hasChildren && isExpanded && renderCategoryTree(children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ════════════════════ PAGE HEADER ════════════════════ */}
      <div className="bg-slate-950 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0066A2] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-4">BỘ SƯU TẬP 2026</p>
          <h1 className="font-display text-6xl md:text-7xl font-medium text-white mb-6">Khám phá phong cách.</h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Nơi hội tụ những thiết kế tinh tế nhất, được tuyển chọn kỹ lưỡng để mang lại vẻ ngoài hoàn hảo cho bạn.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* ════════════════════ SIDEBAR ════════════════════ */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-28 space-y-12">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6 pb-2 border-b border-slate-100 flex items-center justify-between">
                  Danh mục 
                  <span className="text-[10px] text-slate-400 font-normal">({categories.length})</span>
                </h3>
                <button 
                  onClick={() => { setSelectedCategoryId(''); setCurrentPage(1); }}
                  className={`text-sm mb-4 block transition-colors ${!selectedCategoryId ? 'text-[#0066A2] font-bold' : 'text-slate-500 hover:text-[#0066A2]'}`}
                >
                  Tất cả sản phẩm
                </button>
                {renderCategoryTree(categories)}
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6 pb-2 border-b border-slate-100">Khoảng giá</h3>
                <div className="space-y-3">
                  {Object.entries(priceRanges).map(([key, item]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${priceRange === key ? 'border-[#0066A2] bg-[#0066A2]' : 'border-slate-200 group-hover:border-[#0066A2]'}`}>
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                      <input 
                        type="radio" 
                        className="hidden" 
                        checked={priceRange === key} 
                        onChange={() => { setPriceRange(key); setCurrentPage(1); }} 
                      />
                      <span className={`text-sm transition-colors ${priceRange === key ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-900'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ════════════════════ PRODUCT LIST ════════════════════ */}
          <section className="flex-1">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <form onSubmit={(e) => { e.preventDefault(); setKeyword(searchInput); setCurrentPage(1); }}>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-[#0066A2]/30 transition-all shadow-sm"
                  />
                </form>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <select 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none focus:border-[#0066A2] transition-all"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name">Tên A-Z</option>
                </select>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {totalCount} sản phẩm
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 opacity-50">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] bg-slate-100 rounded-[2rem] animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-40 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-6">shopping_bag</span>
                <h3 className="font-display text-3xl font-medium text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-slate-500 text-sm">Hãy thử đổi từ khóa hoặc xóa bớt bộ lọc.</p>
                <button onClick={() => { setSearchInput(''); setKeyword(''); setPriceRange('all'); setSelectedCategoryId(''); }} className="mt-8 text-[#0066A2] font-bold text-sm uppercase tracking-widest border-b-2 border-[#0066A2]">Xóa tất cả bộ lọc</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
                  {products.map((p) => (
                    <Link to={`/product/${p.id || p.productId}`} key={p.id || p.productId} className="group">
                      <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4] mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">
                        <img 
                          src={getImageUrl(p.imageUrl || p.anhDaiDien || p.thumbnailUrl)} 
                          alt={p.name || p.productName} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute top-4 left-4">
                           <span className="bg-[#0066A2] text-white text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase shadow-lg">New</span>
                        </div>
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="bg-white text-slate-950 text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Xem chi tiết</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.categoryName || 'Sản phẩm'}</p>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0066A2] transition-colors line-clamp-1">{p.name || p.productName}</h3>
                        <p className="font-display text-xl font-medium text-[#0066A2]">{formatPrice(p.price || p.basePrice)}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-20 flex items-center justify-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:border-[#0066A2] hover:text-[#0066A2] transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                      <button 
                        key={num}
                        onClick={() => { setCurrentPage(num); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${currentPage === num ? 'bg-[#0066A2] text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:border-[#0066A2] hover:text-[#0066A2] transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
