import React from 'react';

export default function PromoSection() {
  return (
    <section className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-8">
      {/* Voucher/Promo Card */}
      <div className="bg-slate-950 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[450px] relative overflow-hidden group">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066A2]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-6">ƯU ĐÃI ĐẶC QUYỀN</p>
          <h3 className="font-display text-4xl font-medium text-white leading-tight mb-4">
            Ưu đãi lần đầu<br />đặc quyền dành cho bạn.
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Áp dụng mã ngay lần đặt đầu tiên để nhận ưu đãi tốt nhất. Bắt đầu hành trình phong cách mới cùng chúng tôi.
          </p>
        </div>

        <div className="relative z-10">
          <div className="border border-white/10 border-dashed rounded-3xl p-8 mb-6 bg-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Mã giảm giá</p>
            <p className="font-display text-5xl font-medium text-[#0066A2] tracking-widest">SUMMER2026</p>
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Hạn dùng: 08/2026</span>
              <span className="text-[11px] text-[#0066A2] font-bold uppercase tracking-widest">Giảm 15%</span>
            </div>
          </div>
          <div className="flex gap-3">
             <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">Váy lụa</span>
             <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">Áo sơ mi</span>
          </div>
        </div>
      </div>

      {/* Editorial/Quality section */}
      <div className="flex flex-col gap-8">
        <div className="flex-1 bg-[#0066A2]/5 border border-[#0066A2]/10 rounded-[2.5rem] p-10 flex flex-col justify-center">
           <p className="text-[#0066A2] text-[11px] font-black uppercase tracking-[0.25em] mb-4">TRIẾT LÝ THƯƠNG HIỆU</p>
           <h3 className="font-display text-4xl font-medium text-slate-900 leading-tight mb-6">
             Sự sang trọng nằm<br />trong sự tinh tế.
           </h3>
           <p className="text-sm text-slate-500 leading-relaxed mb-8">
             Mỗi sản phẩm không chỉ là món đồ khoác lên mình, mà là một tác phẩm phản ánh gu thẩm mỹ và sự trân trọng bản thân.
           </p>
           <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" alt="Detail 1" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1594938298603-c8148c4b0b4e?w=600&q=80" alt="Detail 2" className="w-full h-full object-cover" />
              </div>
           </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">TỰ HÀO TỪ CLOTHING STORE</p>
           <div className="space-y-4">
              {[
                { title: 'Hàng chính hãng', desc: 'Nhập khẩu trực tiếp từ các đối tác uy tín.' },
                { title: 'Giá trị thực', desc: 'Chất lượng cao cấp với mức giá tối ưu nhất.' },
                { title: 'Cam kết 100%', desc: 'Hoàn tiền nếu sản phẩm không đúng mô tả.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0066A2] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
