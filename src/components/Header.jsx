import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AUTH_EVENT_NAME,
  CART_EVENT_NAME,
  CART_SNAPSHOT_KEY,
  getCartCount,
  readGuestCart,
} from '../utils/cart';

export default function Header() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const syncCartCount = (detail = null) => {
    const countFromDetail = Number(detail?.count);

    if (Number.isFinite(countFromDetail) && countFromDetail >= 0) {
      setCartCount(countFromDetail);
      return;
    }

    const token = localStorage.getItem('token');
    const guestCart = readGuestCart();

    if (token) {
      try {
        const snapshotRaw = localStorage.getItem(CART_SNAPSHOT_KEY);
        const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
        const countFromSnapshot = Number(snapshot?.count);

        if (Number.isFinite(countFromSnapshot) && countFromSnapshot >= 0) {
          setCartCount(countFromSnapshot);
          return;
        }
      } catch (error) {
        console.error('Không thể đọc snapshot giỏ hàng:', error);
      }
    }

    setCartCount(getCartCount(guestCart));
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Lỗi parse thông tin user');
      }
    }

    syncCartCount();

    const handleCartUpdate = (event) => {
      syncCartCount(event?.detail);
    };

    const handleAuthUpdate = (event) => {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          setCurrentUser(JSON.parse(user));
        } catch (error) {
          console.error('Lỗi parse thông tin user');
        }
      } else {
        setCurrentUser(null);
      }

      syncCartCount(event?.detail);
    };

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener(CART_EVENT_NAME, handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener(AUTH_EVENT_NAME, handleAuthUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener(CART_EVENT_NAME, handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsUserDropdownOpen(false);
    syncCartCount();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="container mx-auto flex h-20 items-center justify-between gap-8 px-4">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex-shrink-0 text-2xl font-black uppercase tracking-tighter text-slate-900">
            FASHION STORE
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link
              to="/products"
              className="text-sm font-bold uppercase tracking-widest text-slate-600 transition-colors hover:text-[#ec5b13]"
            >
              Tất cả
            </Link>
            <Link
              to="/products?category=ao"
              className="text-sm font-bold uppercase tracking-widest text-slate-600 transition-colors hover:text-[#ec5b13]"
            >
              Áo
            </Link>
            <Link
              to="/products?category=quan"
              className="text-sm font-bold uppercase tracking-widest text-slate-600 transition-colors hover:text-[#ec5b13]"
            >
              Quần
            </Link>
            <Link
              to="/products?category=phu-kien"
              className="text-sm font-bold uppercase tracking-widest text-slate-600 transition-colors hover:text-[#ec5b13]"
            >
              Phụ kiện
            </Link>
          </nav>
        </div>

        <div className="hidden flex-1 max-w-md md:flex">
          <div className="group relative w-full">
            <input
              className="w-full rounded-full border border-transparent bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#ec5b13] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/20"
              placeholder="Tìm kiếm sản phẩm..."
              type="text"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#ec5b13]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 rounded-full p-2 text-slate-600 transition-all hover:bg-orange-50 hover:text-[#ec5b13]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              {currentUser && (
                <span className="hidden max-w-[100px] truncate text-xs font-bold md:block">
                  {currentUser.fullName}
                </span>
              )}
            </button>

            <div
              className={`absolute right-0 mt-3 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 ${
                isUserDropdownOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'
              }`}
            >
              <div className="flex flex-col py-2">
                {currentUser ? (
                  <>
                    <Link
                      to="/profile"
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#ec5b13]"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      to="/orders"
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#ec5b13]"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Đơn hàng của tôi
                    </Link>
                    <div className="mx-4 my-1 h-px bg-slate-100" />
                    <button
                      type="button"
                      className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#ec5b13]"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Đăng nhập / Đăng ký
                  </Link>
                )}
              </div>
            </div>
          </div>

          <Link to="/cart" className="relative rounded-full p-2 text-slate-600 transition-all hover:bg-orange-50 hover:text-[#ec5b13]">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 rounded-full border-2 border-white bg-[#ec5b13] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button type="button" className="rounded-full p-2 text-slate-600 transition-all hover:bg-orange-50 hover:text-[#ec5b13] lg:hidden">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
