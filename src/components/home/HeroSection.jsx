import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const banners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80',
    title: 'Bộ sưu tập Thu Đông',
    highlight: '2024',
    description: 'Thanh lịch & tinh tế từ những đường cắt may đương đại',
    btnText: 'Khám phá ngay',
    link: '/products?categoryId=1',
    color: '#C4714A'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80',
    title: 'Phong cách tối giản',
    highlight: 'Essential',
    description: 'Tôn vinh vẻ đẹp thuần khiết, chất liệu tự nhiên',
    btnText: 'Xem bộ sưu tập',
    link: '/products?categoryId=2',
    color: '#8B5A2B'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
    title: 'Xu hướng mới nhất',
    highlight: 'Statement',
    description: 'Cá tính và phóng khoáng – dành riêng cho bạn',
    btnText: 'Mua ngay',
    link: '/products',
    color: '#A55233'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80',
    title: 'Bộ sưu tập giới hạn',
    highlight: 'Exclusive',
    description: 'Mỗi thiết kế là một tác phẩm nghệ thuật',
    btnText: 'Đặt trước',
    link: '/products',
    color: '#3D2B1F'
  }
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Optional: restart auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const current = banners[currentIndex];

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Image with Zoom Animation */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out"
        style={{
          backgroundImage: `url(${current.image})`,
          transform: 'scale(1.05)',
          transformOrigin: 'center',
          animation: 'slowZoom 8s ease-out forwards'
        }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 flex items-center h-full max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="text-lumiere-cream max-w-2xl fade-up">
          <div className="inline-block text-[11px] tracking-[0.25em] uppercase border-l-2 border-lumiere-terracotta pl-3 mb-6 font-medium">
            {current.highlight}
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] serif mb-6">
            {current.title}
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-lg mb-10 leading-relaxed">
            {current.description}
          </p>
          <button
            onClick={() => navigate(current.link)}
            className="group relative inline-flex items-center gap-2 bg-lumiere-terracotta hover:bg-lumiere-terracotta/90 text-white text-sm tracking-wider uppercase px-8 py-4 rounded-none transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {current.btnText}
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full transition-all duration-300 group"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-10 bg-lumiere-terracotta'
                : 'w-6 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.08);
          }
        }
        .fade-up {
          animation: fadeUp 0.8s ease-out forwards;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}