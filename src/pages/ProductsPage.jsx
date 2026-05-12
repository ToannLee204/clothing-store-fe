import React, { useEffect, useMemo, useState } from 'react';
import SearchHeader from '../components/products/SearchHeader';
import ProductSidebar from '../components/products/ProductSidebar';
import SortBar from '../components/products/SortBar';
import ProductCard from '../components/common/ProductCard';
import QuickAddModal from '../components/products/QuickAddModal';

const PAGE_SIZE = 12;

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function normalizePagination(payload) {
  const base = payload && typeof payload === 'object' && ('meta' in payload || 'result' in payload)
      ? payload : payload?.data ?? payload;
  const meta = base?.meta ?? base?.data?.meta ?? null;
  const result = normalizeList(base);
  return { meta, result };
}

export default function ProductsPage() {
  const queryParams = new URLSearchParams(window.location.search);
  const collection = queryParams.get('collection');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState(collection === 'new' ? 'newest' : 'newest');
  const [keyword, setKeyword] = useState('');
  const [inStock, setInStock] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  const priceRanges = useMemo(() => ({
    all: { label: 'Tất cả sản phẩm', minPrice: null, maxPrice: null },
    under500k: { label: 'Dưới 500.000₫', minPrice: 0, maxPrice: 500000 },
    from500kTo1m: { label: '500.000₫ - 1.000.000₫', minPrice: 500000, maxPrice: 1000000 },
    over1m: { label: 'Trên 1.000.000₫', minPrice: 1000000, maxPrice: null }
  }), []);

  // Helper to flatten category tree
  const flattenCategories = (categoriesTree, prefix = "") => {
    let flatList = [];
    categoriesTree.forEach((cat) => {
      flatList.push({ ...cat, displayName: prefix + cat.name });
      if (cat.children && cat.children.length > 0) {
        flatList = flatList.concat(flattenCategories(cat.children, prefix + "— "));
      }
    });
    return flatList;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, colorRes, sizeRes] = await Promise.all([
          fetch('/api/v1/categories').catch(() => null),
          fetch('/api/v1/products/attributes/colors').catch(() => null),
          fetch('/api/v1/products/attributes/sizes').catch(() => null)
        ]);
        
        if (catRes && catRes.ok) {
          const payload = await catRes.json().catch(() => null);
          if (payload) {
            const rawItems = normalizeList(payload);
            setCategories(flattenCategories(rawItems));
          }
        }
        
        if (colorRes && colorRes.ok) {
          const payload = await colorRes.json().catch(() => null);
          if (payload) setColors(normalizeList(payload));
        }
        
        if (sizeRes && sizeRes.ok) {
          const payload = await sizeRes.json().catch(() => null);
          if (payload) setSizes(normalizeList(payload));
        }
      } catch (err) { 
        console.error('Lỗi tải dữ liệu lọc:', err); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.append('page', String(currentPage - 1));
        params.append('pageSize', String(PAGE_SIZE));

        if (keyword) params.append('keyword', keyword);
        if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
        if (inStock) params.append('inStock', 'true');
        
        selectedColors.forEach(c => params.append('colors', c));
        selectedSizes.forEach(s => params.append('sizes', s));
        
        if (sortBy !== 'all') params.append('sortBy', sortBy);
        
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
      }
    };
    fetchProducts();
  }, [currentPage, keyword, priceRange, selectedCategoryId, selectedColors, selectedSizes, sortBy, inStock, priceRanges]);

    const handleReset = () => {
      setKeyword(''); 
      setPriceRange('all'); 
      setSelectedCategoryId(''); 
      setSelectedColors([]);
      setSelectedSizes([]);
      setInStock(false);
      setCurrentPage(1);
    };

    return (
    <div className="min-h-screen bg-lumiere-cream">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {/* 1. Search Header */}
        <SearchHeader 
          keyword={keyword} 
          onSearchChange={(val) => { setKeyword(val); setCurrentPage(1); }} 
          totalCount={totalCount}
        />

        <div className="lg:grid lg:grid-cols-4 gap-12 mt-10 pb-20">
          {/* 2. Sidebar Filters */}
          <ProductSidebar 
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={(id) => { setSelectedCategoryId(id); setCurrentPage(1); }}
            colors={colors}
            selectedColors={selectedColors}
            onColorChange={(color) => {
              setSelectedColors(prev => 
                prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
              );
              setCurrentPage(1);
            }}
            sizes={sizes}
            selectedSizes={selectedSizes}
            onSizeChange={(size) => {
              setSelectedSizes(prev => 
                prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
              );
              setCurrentPage(1);
            }}
            priceRange={priceRange}
            onPriceChange={(key) => { setPriceRange(key); setCurrentPage(1); }}
            priceRanges={priceRanges}
            inStock={inStock}
            onInStockChange={(val) => { setInStock(val); setCurrentPage(1); }}
            onReset={handleReset}
          />

          {/* 3. Product List Area */}
          <div className="lg:col-span-3">
            <SortBar 
              sortBy={sortBy} 
              onSortChange={(val) => { setSortBy(val); setCurrentPage(1); }} 
              totalCount={totalCount}
            />

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="bg-lumiere-blush aspect-[3/4] w-full" />
                    <div className="h-6 bg-lumiere-gray/10 w-3/4" />
                    <div className="h-4 bg-lumiere-gray/10 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-lumiere-terracotta serif text-xl">{error}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-32 border border-dashed border-lumiere-gray/30">
                <div className="text-4xl mb-4">🛍</div>
                <h3 className="serif text-2xl font-light text-lumiere-charcoal mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-lumiere-gray mb-8">Hãy thử đổi từ khóa hoặc xóa bớt bộ lọc.</p>
                <button 
                  onClick={() => { 
                    setKeyword(''); 
                    setPriceRange('all'); 
                    setSelectedCategoryId(''); 
                    setSelectedColors([]);
                    setSelectedSizes([]);
                    setInStock(false);
                  }}
                  className="btn-outline"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
                  {products.map((p) => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onAddToCart={(prod) => setQuickAddProduct(prod)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-20 flex items-center justify-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-10 h-10 border border-lumiere-gray/20 flex items-center justify-center text-lumiere-gray disabled:opacity-30 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i + 1}
                        onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`w-10 h-10 text-[11px] font-bold transition-all border ${
                          currentPage === i + 1 
                            ? 'bg-lumiere-charcoal text-lumiere-cream border-lumiere-charcoal' 
                            : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-10 h-10 border border-lumiere-gray/20 flex items-center justify-center text-lumiere-gray disabled:opacity-30 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {quickAddProduct && (
        <QuickAddModal 
          product={quickAddProduct} 
          onClose={() => setQuickAddProduct(null)} 
        />
      )}
    </div>
  );
}
