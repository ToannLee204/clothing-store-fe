import React from 'react';
import { formatPrice } from '../../utils/format';

export default function FeaturedProducts({ products }) {
  return (
    <section id="featured-products" className="bg-slate-50 py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-4">HÀNG MỚI VỀ</p>
            <h2 className="font-display text-5xl md:text-6xl font-medium text-slate-900 leading-tight">
              Bộ sưu tập vừa cập bến.
            </h2>
          </div>
          <a 
            href="/products" 
            className="group inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-[#0066A2] transition-all"
          >
            Xem tất cả 
            <span className="w-8 h-px bg-slate-300 transition-all group-hover:w-12 group-hover:bg-[#0066A2]"></span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <div key={idx} className="group cursor-pointer">
              {/* Product Image Container */}
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl">
                <img 
                  src={product.imageUrl || product.anhDaiDien} 
                  alt={product.productName || product.ten} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                
                {/* Badge Overlay */}
                <div className="absolute top-4 left-4">
                  <span className="bg-[#0066A2] text-white text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase">Mới</span>
                </div>

                {/* Quick Add Button with Admin Style */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <button className="w-full py-3 rounded-xl bg-white text-slate-950 text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-[#0066A2] hover:text-white transition-colors">
                    + Thêm vào giỏ
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{product.categoryName || 'Sản phẩm'}</p>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0066A2] transition-colors">{product.productName || product.ten}</h3>
                <p className="font-display text-xl font-medium text-[#0066A2]">{formatPrice(product.price || product.giaHienTai || 0)}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1">{product.description || 'Chất liệu cao cấp, kiểu dáng hiện đại.'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
