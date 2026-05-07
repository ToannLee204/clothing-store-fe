import { formatPrice } from '../../utils/format';

function SparkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 3l1.9 5.9H20l-4.9 3.6L17 18.6 12 15l-5 3.6 1.9-5.1L4 8.9h6.1L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HeroSection({ heroImage }) {
  return (
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0066A2] px-8 py-4 text-sm font-bold uppercase tracking-[0.14rem] text-white transition-all duration-300 hover:bg-[#005587] hover:shadow-lg hover:shadow-[#0066A2]/30"
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
  );
}
