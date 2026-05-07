import React, { useState, useEffect } from 'react';
import { DANH_MUC, SAN_PHAM } from '../data/mockData';

import HeroSection from '../components/home/HeroSection';
import CategorySpotlight from '../components/home/CategorySpotlight';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromoSection from '../components/home/PromoSection';
import ReviewSection from '../components/home/ReviewSection';

export default function HomePage() {
  const [products, setProducts] = useState(SAN_PHAM.slice(0, 4));
  const [categories, setCategories] = useState(DANH_MUC);
  const [heroImage, setHeroImage] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const prodRes = await fetch('/api/v1/products?page=0&pageSize=4');
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          let prodArr = [];
          if (Array.isArray(prodData)) prodArr = prodData;
          else if (prodData.data && Array.isArray(prodData.data)) prodArr = prodData.data;
          else if (prodData.data?.content && Array.isArray(prodData.data.content)) prodArr = prodData.data.content;
          else if (prodData.content && Array.isArray(prodData.content)) prodArr = prodData.content;
          else if (prodData.result && Array.isArray(prodData.result)) prodArr = prodData.result;

          if (prodArr.length > 0) {
            setProducts(prodArr.slice(0, 4));
            // Try to find a good hero image from products
            const img = prodArr[0]?.imageUrl || prodArr[0]?.anhDaiDien;
            if (img) setHeroImage(img);
          }
        }

        const catRes = await fetch('/api/v1/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          let catArr = [];
          if (Array.isArray(catData)) catArr = catData;
          else if (catData.data && Array.isArray(catData.data)) catArr = catData.data;
          else if (catData.result && Array.isArray(catData.result)) catArr = catData.result;

          if (catArr.length > 0) {
            setCategories(catArr);
          }
        }
      } catch (error) {
        console.error("Lỗi kết nối API trang chủ:", error);
      }
    };

    fetchHomeData();
  }, []);

  const spotlightCategories = [
    {
      title: 'Thời trang Nữ',
      description: 'Thiết kế mềm mại, thanh lịch cho nhịp sống hiện đại.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
    },
    {
      title: 'Phong cách Công sở',
      description: 'Tinh gọn, sang trọng và dễ phối cho mọi ngày làm việc.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b0b4e?w=800&q=80'
    },
    {
      title: 'Phụ kiện cao cấp',
      description: 'Chi tiết nhỏ tạo nên tổng thể khác biệt và đẳng cấp.',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'
    }
  ];

  return (
    <div className="bg-white">
      {/* 1. Hero Section - Inspired by the redesign with Admin Styling */}
      <HeroSection heroImage={heroImage} />

      {/* 2. Category Spotlight - High-end feel */}
      <CategorySpotlight spotlightCategories={spotlightCategories} />

      {/* 3. Featured Products - Clean & Bold */}
      <FeaturedProducts products={products} />

      {/* 4. Promo & Editorial - Derived from the user's HTML design */}
      <PromoSection />

      {/* 5. Social Proof / Reviews - Dark & Premium */}
      <ReviewSection />

      {/* 6. Quick Browse Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="mb-16">
           <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-4">KHÁM PHÁ THEO PHONG CÁCH</p>
           <h2 className="font-display text-5xl md:text-6xl font-medium text-slate-900 leading-tight">
             Tìm đúng thứ bạn cần.
           </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {categories.slice(0, 4).map((cat, idx) => (
             <div key={idx} className="group p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-between min-h-[300px] hover:border-[#0066A2]/30 hover:shadow-xl transition-all cursor-pointer overflow-hidden relative">
                <div className="relative z-10">
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Danh mục {idx + 1}</p>
                   <h3 className="font-display text-4xl font-medium text-slate-900 group-hover:text-[#0066A2] transition-colors">{cat.name || cat.ten}</h3>
                   <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">Bộ sưu tập tinh tuyển, dẫn dắt xu hướng thời trang mới nhất.</p>
                </div>
                <div className="relative z-10 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-900 group-hover:gap-5 transition-all">
                   Khám phá ngay <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
                {/* Decorative icon background */}
                <span className="absolute -bottom-10 -right-10 text-[120px] text-slate-200/50 material-symbols-outlined select-none group-hover:text-[#0066A2]/10 transition-colors">
                  {idx % 2 === 0 ? 'category' : 'checkroom'}
                </span>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}