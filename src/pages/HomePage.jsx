import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import Marquee from '../components/home/Marquee';
import EditorialSection from '../components/home/EditorialSection';
import Newsletter from '../components/home/Newsletter';
import ProductCard from '../components/common/ProductCard';
import QuickAddModal from '../components/products/QuickAddModal';

const API_CATEGORIES = '/api/v1/categories';
const API_PRODUCTS = '/api/v1/products';
const PRODUCTS_PER_CATEGORY = 4; // Số sản phẩm tối đa cho mỗi danh mục cha

// Helper lấy danh mục gốc (parentId == null)
function getRootCategories(categoriesTree) {
  if (!Array.isArray(categoriesTree)) return [];
  return categoriesTree.filter(cat => cat.parentId == null || cat.parentId === undefined);
}

// Lấy sản phẩm theo categoryId
async function fetchProductsByCategory(categoryId, limit = PRODUCTS_PER_CATEGORY) {
  const params = new URLSearchParams({
    page: '0',
    pageSize: String(limit),
    categoryId: String(categoryId),
    sortBy: 'newest',
  });
  const res = await fetch(`${API_PRODUCTS}?${params.toString()}`);
  if (!res.ok) return [];
  const payload = await res.json();
  // Chuẩn hóa dữ liệu (giống normalizeList trong ProductsPage)
  const data = payload?.data ?? payload;
  const items = data?.content ?? data?.result ?? data ?? [];
  return items.slice(0, limit);
}

// Map sản phẩm cho ProductCard (giữ nguyên các trường cần thiết)
function mapProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    productName: product.productName ?? product.name,
    thumbnailUrl: product.thumbnailUrl ?? product.imageUrl,
    basePrice: product.basePrice ?? product.price,
    salePrice: product.salePrice,
    categoryName: product.categoryName,
    isNew: product.isNew,
    variants: product.variants || [], // quan trọng cho QuickAddModal
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]); // [{ category, products }]
  const [loading, setLoading] = useState(true);
  const [quickAddProduct, setQuickAddProduct] = useState(null); // state cho modal

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // 1. Lấy danh mục cha
        const catRes = await fetch(API_CATEGORIES);
        if (!catRes.ok) throw new Error('Không thể tải danh mục');
        const catPayload = await catRes.json();
        const categoriesTree = catPayload?.data ?? catPayload ?? [];
        const rootCats = getRootCategories(categoriesTree);

        if (rootCats.length === 0) {
          if (!cancelled) setSections([]);
          return;
        }

        // 2. Với mỗi danh mục cha, lấy sản phẩm (chạy song song)
        const sectionsData = await Promise.all(
          rootCats.map(async (cat) => {
            const productsRaw = await fetchProductsByCategory(cat.id);
            const products = productsRaw.map(mapProduct).filter(Boolean);
            return { category: cat, products };
          })
        );

        if (!cancelled) {
          // Chỉ giữ những danh mục có sản phẩm
          setSections(sectionsData.filter(section => section.products.length > 0));
        }
      } catch (err) {
        console.error('Lỗi tải trang chủ:', err);
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-lumiere-cream min-h-screen">
        <HeroSection />
        <div className="max-w-screen-xl mx-auto px-6 py-20">
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-16">
              <div className="h-8 w-48 bg-lumiere-gray/20 animate-pulse mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array(4).fill().map((_, idx) => (
                  <div key={idx} className="aspect-[3/4] bg-lumiere-blush/40 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="bg-lumiere-cream min-h-screen">
        <HeroSection />
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-lumiere-gray">Chưa có sản phẩm nào.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-lumiere-cream">
      <HeroSection />
      <Marquee />

      {sections.map(({ category, products }) => (
        <section key={category.id} className="py-12 lg:py-20 border-b border-lumiere-gray/10 last:border-none">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="serif text-3xl lg:text-4xl font-light text-lumiere-charcoal">
                {category.name}
              </h2>
              <button
                onClick={() => navigate(`/products?categoryId=${category.id}`)}
                className="text-xs tracking-wider uppercase text-lumiere-gray hover:text-lumiere-charcoal transition"
              >
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(prod) => setQuickAddProduct(prod)} // mở modal
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      <EditorialSection />
      <Newsletter />

      {/* QuickAddModal để thêm vào giỏ hàng */}
      {quickAddProduct && (
        <QuickAddModal
          product={quickAddProduct}
          onClose={() => setQuickAddProduct(null)}
        />
      )}
    </div>
  );
}