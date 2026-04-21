export default function CategoryShowcase() {
  return (
    <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-24 md:py-32 bg-white">
      <div className="flex flex-col md:flex-row gap-8 items-end mb-20 relative">
        <div className="md:w-1/2 lg:w-1/3 z-10">
          <h2 className="font-headline text-4xl md:text-5xl italic mb-6 text-slate-900">Khám Phá</h2>
          <p className="font-body text-slate-500 leading-relaxed max-w-sm">
            Tuyển chọn những thiết kế mang tính biểu tượng, định hình phong cách cá nhân qua sự tinh tế và tối giản.
          </p>
        </div>
        <div className="absolute right-0 top-0 md:relative md:flex-1 text-right">
          <span className="font-label text-6xl md:text-[10rem] leading-none text-slate-100 select-none font-black tracking-tighter">EST. 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Bộ sưu tập Nam */}
        <div className="md:col-span-7 group cursor-pointer relative overflow-hidden">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl">
            <img 
              alt="Bộ sưu tập nam" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=2080&auto=format&fit=crop"
            />
          </div>
          <div className="mt-6 flex justify-between items-baseline">
            <h3 className="font-headline text-3xl text-slate-900 group-hover:text-[#ec5b13] transition-colors">Nam</h3>
            <span className="font-label uppercase tracking-widest text-xs font-bold text-slate-600 border-b border-slate-300 group-hover:text-[#ec5b13] group-hover:border-[#ec5b13] transition-all">Khám phá ngay</span>
          </div>
        </div>

        {/* Phụ kiện */}
        <div className="md:col-span-5 group cursor-pointer relative overflow-hidden mt-12 md:mt-24">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl">
            <img 
              alt="Phụ kiện" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1738&auto=format&fit=crop"
            />
          </div>
          <div className="mt-6 flex justify-between items-baseline">
            <h3 className="font-headline text-3xl text-slate-900 group-hover:text-[#ec5b13] transition-colors">Phụ kiện</h3>
            <span className="font-label uppercase tracking-widest text-xs font-bold text-slate-600 border-b border-slate-300 group-hover:text-[#ec5b13] group-hover:border-[#ec5b13] transition-all">Xem chi tiết</span>
          </div>
        </div>

        {/* Bộ sưu tập Nữ */}
        <div className="md:col-span-6 md:col-start-4 group cursor-pointer relative overflow-hidden -mt-8 md:-mt-32">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-xl shadow-slate-200/50">
            <img 
              alt="Bộ sưu tập nữ" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1887&auto=format&fit=crop"
            />
          </div>
          <div className="mt-6 flex justify-between items-baseline">
            <h3 className="font-headline text-3xl text-slate-900 group-hover:text-[#ec5b13] transition-colors">Nữ</h3>
            <span className="font-label uppercase tracking-widest text-xs font-bold text-slate-600 border-b border-slate-300 group-hover:text-[#ec5b13] group-hover:border-[#ec5b13] transition-all">Mua ngay</span>
          </div>
        </div>
      </div>
    </section>
  );
}