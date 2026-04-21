import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CHI_TIET_GIO_HANG } from '../data/mockData';

export default function Header() {
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
        
        {/* CỤM 1: Brand Logo & Navigation Menu */}
        <div className="flex items-center gap-10">
          {/* Brand Logo */}
          <Link to="/" className="text-2xl font-black tracking-tighter uppercase text-slate-900 flex-shrink-0">
            FASHION STORE
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/products" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-[#ec5b13] transition-colors">
              Tất cả
            </Link>
            <Link to="/products?category=ao" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-[#ec5b13] transition-colors">
              Áo
            </Link>
            <Link to="/products?category=quan" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-[#ec5b13] transition-colors">
              Quần
            </Link>
            <Link to="/products?category=phu-kien" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-[#ec5b13] transition-colors">
              Phụ kiện
            </Link>
          </nav>
        </div>

        {/* CỤM 2: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full group">
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20 focus:bg-white focus:border-[#ec5b13] transition-all text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Tìm kiếm sản phẩm..." 
              type="text" 
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* CỤM 3: Action Icons */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          
          {/* User Profile & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="p-2 text-slate-600 hover:text-[#ec5b13] hover:bg-orange-50 rounded-full transition-all flex items-center gap-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              {/* Hiển thị tên user trên desktop nếu đã đăng nhập */}
              {currentUser && (
                <span className="hidden md:block text-xs font-bold truncate max-w-[100px]">
                  {currentUser.fullName}
                </span>
              )}
            </button>

            {/* Menu Dropdown */}
            <div className={`absolute right-0 mt-3 w-56 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-xl transition-all duration-300 origin-top-right overflow-hidden ${isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="py-2 flex flex-col">
                {currentUser ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-[#ec5b13] transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link 
                      to="/orders" 
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-[#ec5b13] transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Đơn hàng của tôi
                    </Link>
                    <div className="h-[1px] bg-slate-100 my-1 mx-4"></div>
                    <button 
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors text-left"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-[#ec5b13] transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Đăng nhập / Đăng ký
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Shopping Cart */}
          <Link to="/cart" className="p-2 text-slate-600 hover:text-[#ec5b13] hover:bg-orange-50 rounded-full transition-all relative">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-[#ec5b13] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none border-2 border-white">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle (Hamburger) */}
          <button className="lg:hidden p-2 text-slate-600 hover:text-[#ec5b13] hover:bg-orange-50 rounded-full transition-all">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
          
        </div>
      </div>
    </header>
  );
}