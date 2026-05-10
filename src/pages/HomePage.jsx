import React, { useState, useEffect } from 'react';
import { DANH_MUC, SAN_PHAM } from '../data/mockData';

import HeroSection from '../components/home/HeroSection';
import Marquee from '../components/home/Marquee';
import CategorySpotlight from '../components/home/CategorySpotlight';
import FeaturedProducts from '../components/home/FeaturedProducts';
import EditorialSection from '../components/home/EditorialSection';
import Newsletter from '../components/home/Newsletter';
import ReviewSection from '../components/home/ReviewSection';

export default function HomePage() {
  const [products, setProducts] = useState(SAN_PHAM.slice(0, 4));
  const [categories, setCategories] = useState(DANH_MUC);

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

  return (
    <div className="bg-lumiere-cream">
      {/* 1. Hero Section - LUMIÈRE Redesign */}
      <HeroSection />

      {/* 2. Marquee - Animated Stats Strip */}
      <Marquee />

      {/* 3. Category Grid - Featured Categories */}
      <CategorySpotlight />

      {/* 4. Featured Products - Trending Items */}
      <FeaturedProducts products={products} />

      {/* 5. Editorial Section - Capsule Collection */}
      <EditorialSection />

      {/* 6. Newsletter - Subscription */}
      <Newsletter />

      {/* 7. Review Section - Social Proof */}
      <ReviewSection />
    </div>
  );
}