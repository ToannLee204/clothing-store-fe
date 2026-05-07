import React from 'react';

export default function CategorySpotlight({ spotlightCategories }) {
  return (
    <section className="container mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div className="max-w-2xl">
          <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-4">DANH MỤC TIÊU BIỂU</p>
          <h2 className="font-display text-5xl md:text-6xl font-medium text-slate-900 leading-tight">
            Chọn nhanh theo nhu cầu,<br />giữ trọn vẻ thanh lịch.
          </h2>
        </div>
        <p className="text-sm text-slate-500 max-w-xs md:text-right leading-relaxed mb-2">
          Bộ sưu tập đủ đầy, sắp xếp hợp lý, mang đến cảm hứng thời trang từ cái nhìn đầu tiên.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {spotlightCategories.map((cat, idx) => (
          <div key={idx} className="group relative rounded-3xl overflow-hidden aspect-[4/5] hover-lift cursor-pointer shadow-sm">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={cat.image} 
                alt={cat.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="font-display text-3xl font-medium text-white mb-2">{cat.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed max-w-[200px]">{cat.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-950 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
