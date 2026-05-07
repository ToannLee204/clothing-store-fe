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
    <section className="bg-slate-950 py-24">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <div>
          <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-6">ĐÁNH GIÁ THỰC TẾ</p>
          <h2 className="font-display text-5xl md:text-7xl font-medium text-white leading-tight mb-8">
            Tin cậy tạo nên<br />trải nghiệm<br />mua sắm tốt hơn.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-sm mb-12">
            Hàng ngàn phản hồi chân thực từ khách hàng là minh chứng rõ nhất cho chất lượng và sự tận tâm của chúng tôi.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-950 bg-slate-800" />
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-slate-950 bg-[#0066A2] flex items-center justify-center text-[10px] font-bold text-white">+500</div>
             </div>
             <p className="text-sm text-white/50">Khách hàng đã tin tưởng</p>
          </div>
        </div>

        <div className="space-y-6">
          {reviews.map((rev, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="flex items-center gap-1 mb-6 text-[#0066A2]">
                {Array.from({ length: rev.stars }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-white/90 text-lg font-medium leading-relaxed mb-8 italic">
                {rev.content}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0066A2]/20 flex items-center justify-center text-[#0066A2] font-black text-sm">
                  {rev.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-widest">{rev.name}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
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
