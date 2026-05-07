import React, { useState, useEffect } from 'react';
import { DANH_MUC, SAN_PHAM, MA_GIAM_GIA, DANH_GIA } from '../data/mockData';
import { formatPrice } from '../utils/format';

import HeroSection from '../components/home/HeroSection';
import CategorySpotlight from '../components/home/CategorySpotlight';
import FeaturedProducts from '../components/home/FeaturedProducts';
import SectionTitle from '../components/common/SectionTitle';

function SparkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 3l1.9 5.9H20l-4.9 3.6L17 18.6 12 15l-5 3.6 1.9-5.1L4 8.9h6.1L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState(SAN_PHAM.slice(0, 4));
  const [categories, setCategories] = useState(DANH_MUC);
  const [heroImage, setHeroImage] = useState(SAN_PHAM[2]?.anhDaiDien);

  const review = DANH_GIA[0];
  const voucher = MA_GIAM_GIA[0];

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
            const img = prodArr[2]?.imageUrl || prodArr[0]?.imageUrl;
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
        console.error("Lỗi kết nối API trang chủ, đang dùng mockData:", error);
      }
    };

    fetchHomeData();
  }, []);

  const spotlightCategories = [
    {
      title: 'Nữ',
      description: 'Thiết kế mềm mại, thanh lịch cho nhịp sống hiện đại.',
      image: products[0]?.imageUrl || products[0]?.anhDaiDien || SAN_PHAM[0]?.anhDaiDien
    },
    {
      title: 'Công sở',
      description: 'Tinh gọn, sang trọng và dễ phối cho mọi ngày làm việc.',
      image: products[1]?.imageUrl || products[1]?.anhDaiDien || SAN_PHAM[2]?.anhDaiDien
    },
    {
      title: 'Phụ kiện',
      description: 'Chi tiết nhỏ tạo nên tổng thể khác biệt.',
      image: products[2]?.imageUrl || products[2]?.anhDaiDien || SAN_PHAM[3]?.anhDaiDien
    }
  ];

  const categoryHighlights = categories.slice(0, 3);

  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <HeroSection heroImage={heroImage} />

      {/* Category spotlight */}
      <CategorySpotlight spotlightCategories={spotlightCategories} />

      {/* Featured products */}
      <FeaturedProducts products={products} />

      {/* Collections + voucher */}
      <section id="collections" className="mx-auto max-w-[1920px] px-6 py-20 md:px-12 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
            <SectionTitle
              kicker="Ưu đãi đang mở"
              title="Voucher đặc quyền cho bạn."
              description="Sử dụng mã giảm giá dưới đây để tận hưởng ưu đãi trong lần mua sắm tiếp theo."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.18rem] text-white/55">
                  Mã giảm giá
                </div>
                <div className="mt-3 text-3xl font-black text-white">{voucher?.maVoucher}</div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Giảm {voucher?.loai === 'phan_tram' ? `${voucher?.giaTriGiam}%` : formatPrice(voucher?.giaTriGiam || 0)} cho đơn từ {formatPrice(voucher?.dieuKien || 0)}.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.18rem] text-white/55">
                  Hạn dùng
                </div>
                <div className="mt-3 text-3xl font-black text-white">08/2026</div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Dùng cho chiến dịch mùa hè, trải nghiệm phong cách mới nhất.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {categoryHighlights.map((category) => {
                const catId = category.id || category.maDanhMuc;
                const catName = category.name || category.ten;
                return (
                  <span
                    key={catId}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                  >
                    {catName}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="overflow-hidden rounded-[2rem] bg-slate-50 p-8">
              <SectionTitle
                kicker="Câu chuyện thương hiệu"
                title="Sự sang trọng nằm trong chi tiết."
                description="Mỗi block nội dung được thiết kế để cân bằng giữa cảm xúc, thông tin và hành động."
              />
              <div className="mt-8 grid grid-cols-2 gap-4">
                {spotlightCategories.slice(0, 2).map((item) => (
                  <div key={item.title} className="rounded-3xl bg-white p-4 shadow-sm">
                    <img
                      alt={item.title}
                      className="h-40 w-full rounded-2xl object-cover"
                      src={item.image}
                    />
                    <div className="mt-4 text-base font-bold text-slate-900">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100">
              <SectionTitle
                kicker="Tại sao chọn Clothing Store"
                title="Sản phẩm thật, API thật."
                description="Hệ thống đã được kết nối để đồng bộ dữ liệu thời gian thực."
              />
              <div className="mt-8 grid gap-4">
                {[
                  'Tông màu tối giản với điểm nhấn cam thương hiệu',
                  'Sản phẩm & Danh mục được load trực tiếp từ Backend',
                  'Ảnh lớn, card bo tròn và khoảng thở tốt hơn'
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" />
                    <p className="text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review / social proof */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-[1920px] px-6 md:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionTitle
                kicker="Đánh giá nổi bật"
                title="Nội dung tin cậy tạo cảm giác mua sắm tốt hơn."
                description="Hàng ngàn khách hàng đã trải nghiệm và hài lòng với chất lượng sản phẩm."
              />
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0ea5e9] text-white">
                  <SparkIcon />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.14rem] text-slate-400">
                    Phản hồi thực tế
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {review?.noiDung}
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-500">
                {review?.noiDung}
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-200 overflow-hidden">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuArXuB1gdJIrlfBKGf_MKGfPB_tFvMFNhGXYhUTD1oZ8_wl9VLxP6XJUKvIEjJ5VwLXx17JOffDbVEvdI-Y3qrwpokVtAoum8eux-u1aK0QuJ-5zZDcqzY95RP2HNGcOlemE4BWUx3pBnHRrFIzCaBiKX-IvsK-Y6OXF79fQbLyOQZeakx4gqNV9RHF4rccVyIRw3VdlcNvQpAGS4dDJkCO87lR1JAbLETU3MBtyY3riXPIKgnh51GvTo7nhP6fQIQgG0yrg2qzQ-w" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Hoàng Anh</div>
                  <div className="text-sm text-slate-500">Đánh giá 5 sao, phản hồi tích cực</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary category grid */}
      <section className="mx-auto max-w-[1920px] px-6 py-20 md:px-12 md:py-28">
        <SectionTitle
          kicker="Danh mục sản phẩm"
          title="Khám phá nhanh theo phong cách."
          description="Danh sách được cập nhật trực tiếp từ hệ thống cửa hàng."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => {
            const catId = category.id || category.maDanhMuc;
            const catName = category.name || category.ten;

            return (
              <div
                key={catId}
                className={`rounded-[1.8rem] border border-slate-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0ea5e9] hover:shadow-lg cursor-pointer ${
                  index === 0 ? 'bg-slate-950 text-white' : 'bg-white'
                }`}
              >
                <div className={`text-[0.72rem] font-bold uppercase tracking-[0.18rem] ${index === 0 ? 'text-white/55' : 'text-slate-400'}`}>
                  {index === 0 ? 'Nổi bật' : 'Danh mục'}
                </div>
                <div className="mt-4 text-2xl font-black tracking-tight">{catName}</div>
                <p className={`mt-3 text-sm leading-6 ${index === 0 ? 'text-white/70' : 'text-slate-500'}`}>
                  {index === 0
                    ? 'Mở đầu bằng nhóm sản phẩm chính, phù hợp để dẫn người dùng xuống phần chi tiết.'
                    : 'Một lối đi ngắn gọn và trực quan cho người dùng đang tìm đúng phong cách.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}