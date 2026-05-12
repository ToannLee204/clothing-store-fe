import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-lumiere-charcoal text-lumiere-cream py-16 lg:py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="logo text-[22px] font-light tracking-[0.3em] serif mb-6 block">
              LUMIÈ<span className="text-lumiere-terracotta">RE</span>
            </Link>
            <p className="text-[13px] text-lumiere-cream/45 leading-relaxed max-w-[240px]">
              Thời trang không chỉ là trang phục, đó là cách bạn kể câu chuyện của mình với thế giới.
            </p>
          </div>

          {/* Support Col */}
          <div>
            <h5 className="text-[10px] tracking-[0.2em] uppercase font-medium text-lumiere-gray mb-6">Hỗ trợ</h5>
            <ul className="flex flex-col gap-3">
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Hướng dẫn size</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Đổi trả hàng</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Vận chuyển</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          {/* About Col */}
          <div>
            <h5 className="text-[10px] tracking-[0.2em] uppercase font-medium text-lumiere-gray mb-6">Về chúng tôi</h5>
            <ul className="flex flex-col gap-3">
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Câu chuyện thương hiệu</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Bền vững</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Lookbook</Link></li>
              <li><Link to="#" className="text-[13px] text-lumiere-cream/55 hover:text-lumiere-cream transition-colors">Blog thời trang</Link></li>
            </ul>
          </div>

          {/* Connect Col */}
          <div>
            <h5 className="text-[10px] tracking-[0.2em] uppercase font-medium text-lumiere-gray mb-6">Kết nối</h5>
            <div className="flex gap-4 mb-8">
              <a href="#" className="w-9 h-9 border border-white/15 flex items-center justify-center text-[13px] text-lumiere-cream/55 hover:border-lumiere-cream hover:text-lumiere-cream transition-all">IG</a>
              <a href="#" className="w-9 h-9 border border-white/15 flex items-center justify-center text-[13px] text-lumiere-cream/55 hover:border-lumiere-cream hover:text-lumiere-cream transition-all">FB</a>
              <a href="#" className="w-9 h-9 border border-white/15 flex items-center justify-center text-[13px] text-lumiere-cream/55 hover:border-lumiere-cream hover:text-lumiere-cream transition-all">TK</a>
            </div>
            <div className="text-[12px] text-lumiere-cream/35 space-y-1.5">
              <p>📍 123 Lê Lợi, Q.1, TP.HCM</p>
              <p>📞 1800 1234</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-[12px] text-lumiere-cream/30">
            © 2024 CLOTHING STORE. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link to="#" className="text-[11px] text-lumiere-cream/30 hover:text-lumiere-cream transition-colors">Bảo mật</Link>
            <Link to="#" className="text-[11px] text-lumiere-cream/30 hover:text-lumiere-cream transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
