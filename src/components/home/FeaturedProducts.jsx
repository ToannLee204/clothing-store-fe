import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../common/ProductCard';
import QuickAddModal from '../products/QuickAddModal';

export default function FeaturedProducts({ products }) {
  const navigate = useNavigate();
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-lumiere-cream to-lumiere-blush/30">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-14 gap-6">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-lumiere-terracotta mb-3">
              Xu hướng mới nhất
            </div>
            <h2 className="serif text-[clamp(36px,5vw,56px)] font-light leading-[1.1] text-lumiere-charcoal">
              Sản phẩm<br />nổi bật
            </h2>
          </div>
          
          <button 
            onClick={() => navigate('/products')}
            className="btn-dark hidden lg:inline-block"
          >
            Xem tất cả
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{...product, isNew: true}} // Mocking isNew for visual
              onAddToCart={(prod) => setQuickAddProduct(prod)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-12 lg:hidden">
          <button 
            onClick={() => navigate('/products')}
            className="btn-dark"
          >
            Xem tất cả
          </button>
        </div>
      </div>

      {quickAddProduct && (
        <QuickAddModal 
          product={quickAddProduct} 
          onClose={() => setQuickAddProduct(null)} 
        />
      )}
    </section>
  );
}
