import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CHI_TIET_GIO_HANG } from '../data/mockData';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const totalItems = CHI_TIET_GIO_HANG.reduce((sum, item) => sum + item.soLuong, 0);

  useEffect(() => {
    // Lấy thông tin user từ Local Storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse thông tin user");
      }
    }

    // Xử lý click ra ngoài để đóng dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsUserDropdownOpen(false);
    navigate('/auth'); 
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl w-full top-0 sticky z-50 border-b border-surface-container-highest transition-all duration-300">
      <nav className="flex justify-between items-center w-full px-6 md:px-12 py-5 max-w-[1920px] mx-auto relative h-[80px]">
        
        {/* --- LOGO --- */}
        <div className="flex-shrink-0 z-30">
          <Link to="/" className="flex flex-col leading-none group">
            <span className="font-headline text-2xl font-bold tracking-tighter text-primary italic">Fashion</span>
            <span className="font-label text-[10px] tracking-[0.3em] uppercase opacity-60">Store</span>
          </Link>
        </div>

        {/* --- MENU TRUNG TÂM --- */}
        <div className="flex-1 flex justify-center items-center px-8">
          <div className={`hidden lg:flex gap-10 items-center transition-all ${isSearchOpen ? 'opacity-0 scale-95 invisible' : 'opacity-100 scale-100 visible'}`}>
            <Link to="/" className="relative group text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-[0.15rem] text-[0.6875rem]">
              Đồ Nam
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </Link>
            <Link to="/" className="relative group text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-[0.15rem] text-[0.6875rem]">
              Đồ Nữ
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </Link>
          </div>

          {/* Thanh Search trượt */}
          <div className={`absolute inset-x-24 md:inset-x-48 flex items-center bg-white shadow-sm z-50 px-6 py-2 transition-all duration-500 border-b border-primary/20 ${isSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-body" autoFocus={isSearchOpen} />
            <button onClick={() => setIsSearchOpen(false)}><span className="material-symbols-outlined text-lg">close</span></button>
          </div>
        </div>

        {/* --- ICON BÊN PHẢI --- */}
        <div className="flex items-center gap-6 z-30">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={isSearchOpen ? 'text-secondary' : ''}>
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          
          {/* USER DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              // NẾU ĐÃ ĐĂNG NHẬP
              <>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="text-on-surface hover:opacity-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[24px]">person</span>
                  <span className="hidden md:block text-xs font-bold max-w-[100px] truncate">{currentUser.fullName}</span>
                </button>

                <div className={`absolute right-0 mt-4 w-56 bg-white border border-outline-variant shadow-xl transition-all duration-300 origin-top-right ${isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  <div className="py-2 flex flex-col">
                    <Link 
                      to="/profile" 
                      className="px-6 py-3 text-[11px] font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-3"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg">account_circle</span>
                      Thông tin cá nhân
                    </Link>
                    <Link 
                      to="/orders" 
                      className="px-6 py-3 text-[11px] font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-3"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg">package_2</span>
                      Đơn hàng của tôi
                    </Link>
                    <div className="h-[1px] bg-outline-variant/30 my-1 mx-4"></div>
                    <button 
                      className="px-6 py-3 text-[11px] font-label uppercase tracking-widest text-error hover:bg-error-container/10 transition-colors text-left flex items-center gap-3"
                      onClick={handleLogout}
                    >
                      <span className="material-symbols-outlined text-lg text-error">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // NẾU CHƯA ĐĂNG NHẬP
              <Link 
                to="/auth" 
                className="text-on-surface hover:opacity-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[24px]">person</span>
                <span className="hidden md:block text-[11px] font-label uppercase tracking-widest font-bold">Đăng nhập / Đăng ký</span>
              </Link>
            )}
          </div>
          
          <Link to="/cart" className="text-on-surface hover:opacity-50 relative group">
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-[8px] text-white w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}