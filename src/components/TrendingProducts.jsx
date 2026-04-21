export default function TrendingProducts() {
  return (
    <section className="py-24 md:py-32 bg-slate-50">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-16 gap-6">
          <div className="max-w-md">
            <span className="font-label uppercase tracking-[0.2rem] text-[0.6875rem] text-[#ec5b13] font-bold block mb-4">SẢN PHẨM ĐƯỢC YÊU THÍCH</span>
            <h2 className="font-headline text-4xl md:text-5xl text-slate-900 font-black">Bán Chạy Nhất</h2>
          </div>
          <a className="font-label font-bold uppercase tracking-[0.1rem] text-[0.6875rem] text-slate-600 hover:text-[#ec5b13] transition-colors group flex items-center gap-2" href="#">
            Xem tất cả <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {/* Sản phẩm 1 */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden mb-4 rounded-2xl">
              <img 
                alt="Áo Blazer Linen Tối Giản" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=1887&auto=format&fit=crop"
              />
              <div className="absolute top-4 left-4 bg-white/90 text-[#ec5b13] px-3 py-1.5 rounded-lg font-label text-[10px] font-bold uppercase tracking-widest shadow-sm">Mới về</div>
              <button className="absolute bottom-4 right-4 w-11 h-11 bg-white text-slate-900 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#ec5b13] hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
              </button>
            </div>
            <h4 className="font-body text-sm font-bold text-slate-800 mb-1 group-hover:text-[#ec5b13] transition-colors">Áo Blazer Linen Tối Giản</h4>
            <p className="font-label text-slate-500 font-medium tracking-wider">2.450.000đ</p>
          </div>

          {/* Sản phẩm 2 */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden mb-4 rounded-2xl">
              <img 
                alt="Váy Lụa Satin Đen" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=2071&auto=format&fit=crop"
              />
              <button className="absolute bottom-4 right-4 w-11 h-11 bg-white text-slate-900 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#ec5b13] hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
              </button>
            </div>
            <h4 className="font-body text-sm font-bold text-slate-800 mb-1 group-hover:text-[#ec5b13] transition-colors">Váy Lụa Satin Đen</h4>
            <p className="font-label text-slate-500 font-medium tracking-wider">3.800.000đ</p>
          </div>

          {/* Sản phẩm 3 */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden mb-4 rounded-2xl">
              <img 
                alt="Áo Len Cashmere Kem" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972&auto=format&fit=crop"
              />
              <button className="absolute bottom-4 right-4 w-11 h-11 bg-white text-slate-900 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#ec5b13] hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
              </button>
            </div>
            <h4 className="font-body text-sm font-bold text-slate-800 mb-1 group-hover:text-[#ec5b13] transition-colors">Áo Len Cashmere Kem</h4>
            <p className="font-label text-slate-500 font-medium tracking-wider">1.950.000đ</p>
          </div>

          {/* Sản phẩm 4 */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden mb-4 rounded-2xl">
              <img 
                alt="Sandal Da Thủ Công" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=1887&auto=format&fit=crop"
              />
              <button className="absolute bottom-4 right-4 w-11 h-11 bg-white text-slate-900 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#ec5b13] hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
              </button>
            </div>
            <h4 className="font-body text-sm font-bold text-slate-800 mb-1 group-hover:text-[#ec5b13] transition-colors">Sandal Da Thủ Công</h4>
            <p className="font-label text-slate-500 font-medium tracking-wider">1.250.000đ</p>
          </div>
        </div>
      </div>
    </section>
  );
}