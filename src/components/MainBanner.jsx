export default function MainBanner() {
  return (
    <section className="relative w-full h-[921px] bg-surface-container overflow-hidden">
      <div className="absolute inset-0">
        <img alt="Bộ sưu tập thời trang cao cấp" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format" />
      </div>
      <div className="absolute inset-0 hero-gradient flex items-center px-12">
        <div className="max-w-2xl">
          <span className="font-label uppercase tracking-[0.2rem] text-xs text-secondary mb-4 block">BỘ SƯU TẬP MỚI 2026</span>
          <h1 className="font-headline text-[5rem] leading-[0.95] tracking-tighter mb-8 italic text-primary">Sự Tĩnh Lặng <br/>Trong Từng <br/>Sợi Vải.</h1>
          <div className="flex items-center gap-8">
            <a className="bg-black text-white px-10 py-4 font-label uppercase tracking-[0.1rem] text-xs transition-all duration-300 hover:opacity-90 active:scale-95" href="#">Mua ngay</a>
            <a className="font-label uppercase tracking-[0.1rem] text-xs border-b border-on-surface pb-1 hover:text-secondary hover:border-secondary transition-colors" href="#">Xem bộ sưu tập</a>
          </div>
        </div>
      </div>
    </section>
  );
}