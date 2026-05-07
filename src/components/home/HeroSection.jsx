import React from 'react';
import { getImageUrl } from '../../utils/format';

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-950">
      {/* Background Image with Zoom and Admin-like gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={getImageUrl(heroImage)}
          alt="Hero Fashion"
          className="w-full h-full object-cover opacity-50 scale-105 animate-[pulse_10s_infinite]"
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="text-reveal flex items-center gap-3 mb-8" style={{ animationDelay: '0.1s' }}>
            <span className="w-10 h-px bg-[#0066A2]"></span>
            <span className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em]">BỘ SƯU TẬP MỚI 2026</span>
          </div>

          {/* Headline with Serif Font */}
          <h1 className="text-reveal font-display text-6xl md:text-8xl font-medium text-white leading-[0.95] tracking-tight mb-8" style={{ animationDelay: '0.3s' }}>
            Tối giản hơn.<br />
            Tinh tế hơn.<br />
            <em className="text-[#0066A2] not-italic">Đúng phong cách</em><br />
            của riêng bạn.
          </h1>

          {/* Description */}
          <p className="text-reveal text-lg text-slate-300 leading-relaxed max-w-xl mb-12" style={{ animationDelay: '0.5s' }}>
            Không phải thời trang nhập nhằng. Từng sản phẩm được chọn lọc kỹ lưỡng để bạn luôn tỏa sáng mà không cần cố gắng.
          </p>

          {/* Buttons with Admin style */}
          <div className="text-reveal flex flex-wrap items-center gap-4 mb-16" style={{ animationDelay: '0.7s' }}>
            <a 
              href="/products" 
              className="px-10 py-4 rounded-full bg-[#0066A2] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#005587] transition-all hover:shadow-xl hover:shadow-[#0066A2]/20"
            >
              Khám phá ngay →
            </a>
            <a 
              href="#collections" 
              className="px-10 py-4 rounded-full border border-white/20 text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all"
            >
              Xem câu chuyện
            </a>
          </div>

          {/* Stats with Admin look */}
          <div className="text-reveal flex flex-wrap items-center gap-12" style={{ animationDelay: '0.9s' }}>
            <div>
              <p className="font-display text-4xl font-medium text-white">120+</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Mẫu thiết kế</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div>
              <p className="font-display text-4xl font-medium text-white">24h</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Giao nhanh</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div>
              <p className="font-display text-4xl font-medium text-white">98%</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Hài lòng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/30">
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Cuộn xuống</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"></div>
      </div>
    </section>
  );
}
