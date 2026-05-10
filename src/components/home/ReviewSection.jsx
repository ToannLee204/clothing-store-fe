import React from 'react';

export default function ReviewSection() {
  const reviews = [
    {
      name: 'Hoàng Anh',
      initial: 'H',
      time: '2 ngày trước',
      product: 'Váy lụa cao cấp',
      content: '“Chất liệu vải cực kỳ mềm mại và thoáng mát. Form dáng chuẩn như mô tả, mình rất hài lòng với dịch vụ chăm sóc khách hàng của shop.”',
      stars: 5
    },
    {
      name: 'Linh Chi',
      initial: 'L',
      time: '5 ngày trước',
      product: 'Áo Blazer công sở',
      content: '“Màu sắc tinh tế, đường may rất sắc sảo. Đây là lần thứ 3 mình mua tại Clothing Store và chưa bao giờ thất vọng.”',
      stars: 5
    }
  ];

  return (
    <section className="bg-lumiere-cream py-24 border-t border-lumiere-gray/10">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div>
          <p className="text-lumiere-terracotta text-[10px] font-medium uppercase tracking-[0.25em] mb-6">ĐÁNH GIÁ THỰC TẾ</p>
          <h2 className="serif text-[clamp(36px,5vw,56px)] font-light text-lumiere-charcoal leading-tight mb-8">
            Tin cậy tạo nên<br />trải nghiệm<br />mua sắm tốt hơn.
          </h2>
          <p className="text-sm text-lumiere-gray leading-relaxed max-w-sm mb-12">
            Hàng ngàn phản hồi chân thực từ khách hàng là minh chứng rõ nhất cho chất lượng và sự tận tâm của chúng tôi.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-lumiere-cream bg-lumiere-blush" />
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-lumiere-cream bg-lumiere-charcoal flex items-center justify-center text-[10px] font-bold text-white">+500</div>
             </div>
             <p className="text-[12px] tracking-wider text-lumiere-gray uppercase">Khách hàng đã tin tưởng</p>
          </div>
        </div>

        <div className="space-y-6">
          {reviews.map((rev, idx) => (
            <div key={idx} className="bg-white border border-lumiere-gray/10 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-1 mb-6 text-lumiere-gold text-xs">
                {Array.from({ length: rev.stars }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-lumiere-charcoal text-lg serif leading-relaxed mb-8 italic">
                {rev.content}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-lumiere-blush flex items-center justify-center text-lumiere-terracotta font-bold text-sm serif">
                  {rev.initial}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-lumiere-charcoal uppercase tracking-widest">{rev.name}</p>
                  <p className="text-[10px] text-lumiere-gray font-medium uppercase tracking-widest mt-1">
                    {rev.time} · {rev.product}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
