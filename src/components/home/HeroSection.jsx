import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-bg min-h-screen flex items-center pt-20">
      <div className="hero-accent absolute bottom-[-40px] right-[-40px] text-[clamp(100px,18vw,220px)] font-light text-white/5 pointer-events-none leading-none serif">
        MODE
      </div>
      
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 w-full py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div className="fade-up">
          <div className="inline-block text-[10px] tracking-[0.25em] uppercase text-lumiere-terracotta border border-lumiere-terracotta px-3.5 py-1.5 mb-6">
            Bộ sưu tập Xuân / Hè 2024
          </div>
          
          <h1 className="text-[clamp(52px,8vw,96px)] font-light leading-[1.05] text-lumiere-cream tracking-tight serif mb-8">
            Phong cách<br />
            của <em className="italic text-lumiere-terracotta">bạn</em>,<br />
            câu chuyện<br />
            của tôi.
          </h1>
          
          <p className="text-sm leading-relaxed text-lumiere-cream/55 max-w-[400px] mb-10">
            Khám phá những thiết kế thời trang tinh tế, kết hợp giữa vẻ đẹp đương đại và sự thanh lịch trường tồn. Mỗi trang phục là một tác phẩm nghệ thuật.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-14">
            <button 
              onClick={() => navigate('/products')}
              className="btn-primary"
            >
              Mua ngay
            </button>
            <button className="btn-outline">Xem lookbook</button>
          </div>
          
          <div className="flex gap-12 pt-8 border-t border-white/10">
            <div>
              <div className="text-4xl text-lumiere-cream font-light serif">12K+</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-lumiere-cream/40 mt-1">Khách hàng</div>
            </div>
            <div>
              <div className="text-4xl text-lumiere-cream font-light serif">380+</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-lumiere-cream/40 mt-1">Mẫu thiết kế</div>
            </div>
            <div>
              <div className="text-4xl text-lumiere-cream font-light serif">98%</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-lumiere-cream/40 mt-1">Hài lòng</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Placeholder */}
        <div className="relative fade-up delay-1 h-[580px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3D2B1F] to-lumiere-terracotta/10 rounded overflow-hidden flex flex-col items-center justify-center gap-4">
            <svg width="160" height="320" viewBox="0 0 160 320" fill="none" className="opacity-40">
              <ellipse cx="80" cy="38" rx="28" ry="32" stroke="rgba(248,243,236,0.5)" strokeWidth="1.5" />
              <path
                d="M52 68 C30 90 20 130 24 180 L40 180 L44 280 L116 280 L120 180 L136 180 C140 130 130 90 108 68 C96 76 64 76 52 68Z"
                stroke="rgba(248,243,236,0.4)" strokeWidth="1.5" fill="rgba(196,113,74,0.1)" />
              <path d="M52 68 L20 140" stroke="rgba(248,243,236,0.3)" strokeWidth="1.2" />
              <path d="M108 68 L140 140" stroke="rgba(248,243,236,0.3)" strokeWidth="1.2" />
            </svg>
            <div className="text-[14px] text-lumiere-cream/30 tracking-[0.15em] uppercase serif">Hình ảnh sản phẩm</div>
          </div>
          
          {/* Bestseller Badge Card */}
          <div className="absolute bottom-10 left-[-20px] bg-lumiere-cream p-5 md:p-6 shadow-2xl">
            <div className="text-[10px] tracking-[0.2em] uppercase text-lumiere-gray mb-1">Bestseller</div>
            <div className="text-xl serif">Áo Linen Trắng</div>
            <div className="text-[13px] text-lumiere-terracotta mt-0.5">790.000 ₫</div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-bg {
          background: linear-gradient(135deg, #2C2420 0%, #1A1A1A 40%, #3D2B1F 100%);
          position: relative;
          overflow: hidden;
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(196, 113, 74, 0.15) 0%, transparent 60%);
        }
      `}} />
    </section>
  );
}
