export default function MainBanner() {
  return (
    <section className="relative w-full h-[921px] bg-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <img alt="Bộ sưu tập thời trang cao cấp" className="w-full h-full object-cover opacity-80" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center px-12 md:px-24">
        <div className="max-w-2xl">
          <span className="font-label uppercase tracking-[0.2rem] text-xs text-[#ec5b13] font-bold mb-4 block">BỘ SƯU TẬP MỚI 2026</span>
          <h1 className="font-headline text-[5rem] leading-[0.95] tracking-tighter mb-8 italic text-white drop-shadow-lg">Sự Tĩnh Lặng <br/>Trong Từng <br/>Sợi Vải.</h1>
          <div className="flex items-center gap-8">
            <a className="bg-[#ec5b13] text-white px-10 py-4 rounded-xl font-label uppercase tracking-[0.1rem] text-xs font-bold transition-all duration-300 hover:bg-[#d95210] hover:shadow-lg hover:shadow-[#ec5b13]/30 active:scale-95" href="#">Mua ngay</a>
            <a className="font-label uppercase tracking-[0.1rem] text-xs text-white border-b border-white pb-1 hover:text-[#ec5b13] hover:border-[#ec5b13] transition-colors" href="#">Xem bộ sưu tập</a>
          </div>
        </div>
      </div>
    </section>
  );
}