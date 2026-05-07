import SectionTitle from '../common/SectionTitle';
import { formatPrice } from '../../utils/format';

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

export default function FeaturedProducts({ products }) {
  return (
    <section id="featured-products" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-[1920px] px-6 md:px-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionTitle
            kicker="Sản phẩm mới"
            title="Bộ sưu tập vừa cập bến."
            description="Những thiết kế mới nhất vừa được đưa lên kệ, lấy trực tiếp từ hệ thống dữ liệu."
          />
          <a
            className="inline-flex items-center gap-2 self-start text-[0.72rem] font-bold uppercase tracking-[0.18rem] text-slate-500 transition-colors hover:text-[#0066A2] sm:self-auto"
            href="/products"
          >
            Xem toàn bộ
            <ArrowIcon />
          </a>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => {
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
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18rem] text-[#0066A2] shadow-sm">
                    Mới về
                  </div>
                  <button className="absolute bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-all duration-300 hover:bg-[#0066A2] hover:text-white">
                    <SparkIcon />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-[#0066A2]">
                        {name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {desc}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#0066A2]">
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
  );
}
