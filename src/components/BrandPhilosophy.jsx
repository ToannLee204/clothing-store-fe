export default function BrandPhilosophy() {
    return (
      <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        <div className="order-2 md:order-1">
          <span className="font-label uppercase tracking-[0.2rem] text-xs text-secondary mb-4 block">TRIẾT LÝ THIẾT KẾ</span>
          <h2 className="font-headline text-4xl md:text-6xl leading-tight mb-8">Vẻ đẹp trường tồn của sự tối giản.</h2>
          <p className="font-body text-base md:text-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
            Chúng tôi tin rằng thời trang không chỉ là trang phục, mà là cách bạn thể hiện bản thân với thế giới. Mỗi sản phẩm được chế tác tỉ mỉ từ những chất liệu cao cấp nhất, hướng tới sự bền vững và phong cách không bao giờ lỗi mốt.
          </p>
          <div className="grid grid-cols-2 gap-8 border-t border-outline-variant pt-10">
            <div>
              <h5 className="font-headline text-2xl mb-2 italic">Chất liệu</h5>
              <p className="font-body text-sm text-on-surface-variant">Lụa tơ tằm, linen hữu cơ và cotton cao cấp.</p>
            </div>
            <div>
              <h5 className="font-headline text-2xl mb-2 italic">Tỉ mỉ</h5>
              <p className="font-body text-sm text-on-surface-variant">Từng đường kim mũi chỉ được thực hiện thủ công.</p>
            </div>
          </div>
        </div>
        
        <div className="order-1 md:order-2">
          <div className="relative">
            <img 
              alt="Hậu trường thiết kế" 
              className="w-full aspect-[4/5] object-cover" 
              src="https://images.unsplash.com/photo-1558769132-cb1fac0840c2?q=80&w=1974&auto=format&fit=crop"
            />
            <div className="absolute -bottom-12 -left-12 w-48 h-64 border-[12px] border-surface z-10 hidden lg:block">
              <img 
                alt="Chi tiết vải" 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1620794341491-9f5466b039cb?q=80&w=1974&auto=format&fit=crop"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }