import React, { useState, useEffect } from 'react';
import {
  DANH_MUC,
  SAN_PHAM,
  MA_GIAM_GIA,
  DANH_GIA
} from '../data/mockData';

function formatPrice(value) {
  if (!value) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 3l1.9 5.9H20l-4.9 3.6L17 18.6 12 15l-5 3.6 1.9-5.1L4 8.9h6.1L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionTitle({ kicker, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto text-center max-w-3xl' : 'max-w-3xl'}>
      {kicker ? (
        <span className="mb-4 block text-[0.72rem] font-bold uppercase tracking-[0.22rem] text-[#ec5b13]">
          {kicker}
        </span>
      ) : null}
      <h2 className="font-headline text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-7 text-slate-500 md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  // 1. STATE LƯU TRỮ DỮ LIỆU (Mặc định lấy từ mockData để trang không bị trắng khi load)
  const [products, setProducts] = useState(SAN_PHAM.slice(0, 4));
  const [categories, setCategories] = useState(DANH_MUC);
  const [heroImage, setHeroImage] = useState(SAN_PHAM[2]?.anhDaiDien);

  // Dữ liệu chưa có API Public, dùng Mock
  const review = DANH_GIA[0];
  const voucher = MA_GIAM_GIA[0];

  // 2. GỌI API ĐỂ CẬP NHẬT DỮ LIỆU THẬT
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch Sản phẩm nổi bật
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
            setProducts(prodArr.slice(0, 4)); // Lấy 4 cái mới nhất
            // Set ảnh nền Hero bằng ảnh sản phẩm đầu tiên hoặc thứ 3 cho ngầu
            const img = prodArr[2]?.imageUrl || prodArr[0]?.imageUrl;
            if (img) setHeroImage(img);
          }
        }

        // Fetch Danh mục
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

  // Map lại dữ liệu danh mục nổi bật (Lấy ảnh từ sản phẩm API để nó sinh động)
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
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img
            alt="Bộ sưu tập thời trang cao cấp"
            className="h-full w-full object-cover opacity-60"
            src={heroImage}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-[1920px] items-center px-6 py-24 md:px-12">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.22rem] text-white/85 backdrop-blur">
              <SparkIcon />
              Bộ sưu tập mới 2026
            </span>
            <h1 className="font-headline text-5xl font-black leading-[0.92] tracking-tight text-white md:text-7xl">
              Tối giản hơn.
              <br />
              Tinh tế hơn.
              <br />
              Đúng phong cách của bạn.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              Khám phá những thiết kế hiện đại, giữ nguyên tinh thần sang trọng nhưng được làm mới bằng bố cục rõ ràng, chất liệu cao cấp và trải nghiệm mua sắm mượt mà hơn.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ec5b13] px-8 py-4 text-sm font-bold uppercase tracking-[0.14rem] text-white transition-all duration-300 hover:bg-[#d95210] hover:shadow-lg hover:shadow-[#ec5b13]/30"
                href="#featured-products"
              >
                Khám phá ngay
                <ArrowIcon />
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.14rem] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-slate-950"
                href="#story"
              >
                Xem câu chuyện
              </a>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { value: '120+', label: 'Thiết kế được chọn lọc' },
                { value: '24h', label: 'Giao diện cập nhật nhanh' },
                { value: '98%', label: 'Khách hàng hài lòng' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur"
                >
                  <div className="text-3xl font-black text-white">{item.value}</div>
                  <div className="mt-2 text-sm leading-6 text-white/65">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category spotlight */}
      <section className="mx-auto max-w-[1920px] px-6 py-20 md:px-12 md:py-28">
        <SectionTitle
          kicker="Danh mục nổi bật"
          title="Chọn nhanh theo nhu cầu, giữ trọn vẻ thanh lịch."
          description="Bố cục mới được tối ưu để người dùng lướt nhanh, hiểu nhanh và đi thẳng tới nhóm sản phẩm mình quan tâm."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {spotlightCategories.map((item, index) => (
            <article
              key={item.title}
              className={`group overflow-hidden rounded-[2rem] bg-slate-50 ${index === 1 ? 'md:mt-10' : ''}`}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={item.image}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-headline text-3xl font-black text-slate-900">{item.title}</h3>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#ec5b13] shadow-sm transition-all group-hover:bg-[#ec5b13] group-hover:text-white">
                    <ArrowIcon />
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section id="featured-products" className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-[1920px] px-6 md:px-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionTitle
              kicker="Sản phẩm mới"
              title="Bộ sưu tập vừa cập bến."
              description="Những thiết kế mới nhất vừa được đưa lên kệ, lấy trực tiếp từ hệ thống dữ liệu."
            />
            <a
              className="inline-flex items-center gap-2 self-start text-[0.72rem] font-bold uppercase tracking-[0.18rem] text-slate-500 transition-colors hover:text-[#ec5b13] sm:self-auto"
              href="/products"
            >
              Xem toàn bộ
              <ArrowIcon />
            </a>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => {
              // Hỗ trợ cả property của MockData (tiếng Việt) và API (tiếng Anh)
              const id = product.id || product.maSP;
              const name = product.name || product.ten;
              const desc = product.description || product.moTa;
              const price = product.price || product.gia;
              const image = product.imageUrl || product.anhDaiDien;

              return (
                <article
                  key={id}
                  className="group overflow-hidden rounded-[1.8rem] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-200">
                    <img
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={image}
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18rem] text-[#ec5b13] shadow-sm">
                      Mới về
                    </div>
                    <button className="absolute bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-all duration-300 hover:bg-[#ec5b13] hover:text-white">
                      <SparkIcon />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-[#ec5b13]">
                          {name}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {desc}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#ec5b13]">
                        {formatPrice(price)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
                kicker="Tại sao chọn Lumina"
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
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#ec5b13]" />
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
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ec5b13] text-white">
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
                className={`rounded-[1.8rem] border border-slate-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#ec5b13] hover:shadow-lg cursor-pointer ${
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