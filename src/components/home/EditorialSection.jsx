import React from 'react';

export default function EditorialSection() {
  return (
    <section className="max-w-screen-xl mx-auto px-6 lg:px-12 py-20">
      <div className="bg-lumiere-charcoal p-10 lg:p-20 grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-lumiere-terracotta mb-5">
            Bộ sưu tập giới hạn
          </div>
          <h2 className="serif text-[clamp(32px,4vw,52px)] text-lumiere-cream font-light leading-[1.15] mb-5">
            Capsule Collection<br /><em className="italic">Autumn 2024</em>
          </h2>
          <p className="text-sm text-lumiere-cream/50 leading-relaxed mb-8 max-w-md">
            Chỉ 50 bộ độc quyền. Chất liệu cao cấp, thiết kế thủ công tinh xảo. Mỗi chiếc là một câu chuyện riêng.
          </p>
          <button className="btn-primary">Khám phá ngay</button>
        </div>
        
        <div className="h-[300px] bg-gradient-to-br from-[#3D2B1F] to-lumiere-terracotta/20 flex items-center justify-center">
          <div className="text-center">
            <div className="serif text-[80px] text-lumiere-cream/5 leading-none">50</div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-lumiere-cream/30">
              Phiên bản giới hạn
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
