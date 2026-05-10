import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CategorySpotlight() {
  const navigate = useNavigate();

  const categories = [
    {
      label: 'Đầm & Váy',
      sub: '248 sản phẩm',
      bg: 'bg-lumiere-blush',
      gradient: 'from-[#E8D5C8] to-[#D4B8A5]',
      icon: (
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none" className="opacity-40">
          <ellipse cx="40" cy="18" rx="14" ry="16" stroke="var(--lumiere-charcoal)" strokeWidth="1" />
          <path d="M26 34C16 44 12 64 14 90L22 90L24 140L56 140L58 90L66 90C68 64 64 44 54 34Z"
            stroke="var(--lumiere-charcoal)" strokeWidth="1" fill="rgba(196,113,74,0.2)" />
        </svg>
      )
    },
    {
      label: 'Áo Blouse',
      sub: '185 sản phẩm',
      bg: 'bg-[#DDD4C8]',
      gradient: 'from-[#D4C8BC] to-[#C0B0A0]',
      icon: (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" className="opacity-40">
          <rect x="10" y="20" width="80" height="90" rx="2" stroke="var(--lumiere-charcoal)" strokeWidth="1"
            fill="rgba(196,113,74,0.15)" />
          <path d="M10 20 L30 5 L50 20 L70 5 L90 20" stroke="var(--lumiere-charcoal)" strokeWidth="1" />
          <line x1="10" y1="60" x2="90" y2="60" stroke="var(--lumiere-charcoal)" strokeWidth="0.8"
            strokeDasharray="4" />
        </svg>
      )
    },
    {
      label: 'Quần & Jeans',
      sub: '312 sản phẩm',
      bg: 'bg-[#C8CDD4]',
      gradient: 'from-[#BEC4CC] to-[#A8B0BC]',
      icon: (
        <svg width="80" height="140" viewBox="0 0 80 140" fill="none" className="opacity-40">
          <path d="M15 20 L65 20 L65 130 L15 130 Z" stroke="var(--lumiere-charcoal)" strokeWidth="1"
            fill="rgba(196,113,74,0.15)" />
          <path d="M30 20 L30 130 M50 20 L50 130" stroke="var(--lumiere-charcoal)" strokeWidth="0.8"
            strokeDasharray="3" />
          <path d="M15 60 L65 60" stroke="var(--lumiere-charcoal)" strokeWidth="1" />
        </svg>
      )
    },
    {
      label: 'Áo Khoác',
      sub: '94 sản phẩm',
      bg: 'bg-[#D4C8C0]',
      gradient: 'from-[#CCC0B8] to-[#BCA8A0]',
      icon: (
        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" className="opacity-40">
          <path d="M10 60 L30 10 L50 25 L70 10 L90 60 Z" stroke="var(--lumiere-charcoal)" strokeWidth="1"
            fill="rgba(196,113,74,0.15)" />
          <path d="M30 60 L30 75 M70 60 L70 75" stroke="var(--lumiere-charcoal)" strokeWidth="1" />
        </svg>
      )
    }
  ];

  return (
    <section className="max-w-screen-xl mx-auto px-6 lg:px-12 py-20">
      <div className="flex items-center gap-5 text-lumiere-gray text-[11px] tracking-[0.2em] uppercase mb-14 before:flex-1 before:h-px before:bg-lumiere-gray/30 after:flex-1 after:h-px after:bg-lumiere-gray/30">
        Danh mục nổi bật
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div 
            key={idx} 
            className="group relative h-[340px] overflow-hidden cursor-pointer"
            onClick={() => navigate('/products')}
          >
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105 bg-gradient-to-br ${cat.gradient}`}>
              {cat.icon}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-lumiere-charcoal/75 via-transparent to-transparent flex flex-col justify-end p-7">
              <div className="text-[28px] font-light text-white serif mb-1.5">{cat.label}</div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-white/60">{cat.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
