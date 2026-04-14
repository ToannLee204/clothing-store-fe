export default function Footer() {
    return (
      <footer className="bg-[#2C3E50] text-white w-full mt-12 md:mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-6 md:px-12 py-16 md:py-20 max-w-[1920px] mx-auto">
          <div className="flex flex-col gap-6">
            <a className="text-xl font-headline font-bold text-white tracking-tighter" href="#">FASHION STORE</a>
            <p className="font-body text-sm leading-relaxed text-gray-300 max-w-xs">
              Điểm đến của sự tinh tế và đẳng cấp trong thời trang tối giản.
            </p>
          </div>
          
          <div>
            <h5 className="font-label uppercase tracking-widest text-xs mb-6 text-[#C8A882]">Danh mục</h5>
            <ul className="flex flex-col gap-4">
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Nam</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Nữ</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Phụ kiện</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Giảm giá</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-label uppercase tracking-widest text-xs mb-6 text-[#C8A882]">Hỗ trợ</h5>
            <ul className="flex flex-col gap-4">
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Giao hàng & Đổi trả</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Hướng dẫn chọn size</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Thanh toán</a></li>
              <li><a className="text-gray-300 hover:text-[#C8A882] transition-colors text-sm" href="#">Liên hệ</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-label uppercase tracking-widest text-xs mb-6 text-[#C8A882]">Bản tin</h5>
            <p className="font-body text-sm leading-relaxed text-gray-300 max-w-xs mb-4">
              Đăng ký để nhận tin tức về bộ sưu tập mới nhất.
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <input 
                className="w-full bg-transparent border-b border-gray-600 py-2 focus:border-[#C8A882] transition-colors outline-none text-sm placeholder:text-gray-400 focus:ring-0" 
                placeholder="Email của bạn" 
                type="email"
                required
              />
              <button className="absolute right-0 bottom-2 hover:opacity-80 transition-opacity" type="submit">
                <span className="material-symbols-outlined text-sm text-[#C8A882]">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
        
        <div className="px-6 md:px-12 py-8 border-t border-white/10 max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <span className="font-label uppercase tracking-widest text-[10px] text-gray-400">
            © 2026 FASHION STORE. BẢN QUYỀN ĐƯỢC BẢO LƯU.
          </span>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <a className="font-label uppercase tracking-widest text-[10px] text-gray-400 hover:text-white transition-colors" href="#">Điều khoản</a>
            <a className="font-label uppercase tracking-widest text-[10px] text-gray-400 hover:text-white transition-colors" href="#">Quyền riêng tư</a>
            <a className="font-label uppercase tracking-widest text-[10px] text-gray-400 hover:text-white transition-colors" href="#">Bền vững</a>
          </div>
        </div>
      </footer>
    );
  }