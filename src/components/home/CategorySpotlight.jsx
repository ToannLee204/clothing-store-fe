import SectionTitle from '../common/SectionTitle';

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CategorySpotlight({ spotlightCategories }) {
  return (
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
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0066A2] shadow-sm transition-all group-hover:bg-[#0066A2] group-hover:text-white">
                  <ArrowIcon />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
