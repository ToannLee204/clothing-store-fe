import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AUTH_EVENT_NAME,
  CART_EVENT_NAME,
  CART_SNAPSHOT_KEY,
  getCartCount,
  readGuestCart,
} from '../../utils/cart';

export default function Header() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

    const handleCartUpdate = (event) => syncCartCount(event?.detail);
    const handleAuthUpdate = (event) => {
      const user = localStorage.getItem('user');
      if (user) {
        try { setCurrentUser(JSON.parse(user)); } catch (error) { console.error('Lỗi parse thông tin user'); }
      } else { setCurrentUser(null); }
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
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-lumiere-cream/95 backdrop-blur-xl border-b border-lumiere-gray/15 transition-all duration-300 px-6 lg:px-12 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between relative">
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden flex flex-col gap-1.5 p-1" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`w-6 h-0.5 block bg-lumiere-charcoal transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-4 h-0.5 block bg-lumiere-charcoal transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 block bg-lumiere-charcoal transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Trang chủ</Link>
            <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>Sản phẩm</Link>
          </div>

          {/* Logo */}
          <Link 
            to="/" 
            className="logo absolute left-1/2 -translate-x-1/2 text-[26px] font-light tracking-[0.3em] text-lumiere-charcoal serif uppercase"
          >
            Clothing <span className="text-lumiere-terracotta">Store</span>
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-6">
            <Link to="/products" className="nav-link hidden lg:block">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="nav-link flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {currentUser && <span className="hidden lg:block text-[10px] tracking-widest uppercase">{currentUser.fullName}</span>}
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-4 w-48 bg-lumiere-cream border border-lumiere-gray/15 shadow-2xl py-2 z-50">
                  {currentUser ? (
                    <>
                      <Link to="/profile" className="block px-4 py-2 text-[11px] uppercase tracking-wider text-lumiere-gray hover:text-lumiere-charcoal">Hồ sơ</Link>
                      <Link to="/orders" className="block px-4 py-2 text-[11px] uppercase tracking-wider text-lumiere-gray hover:text-lumiere-charcoal">Đơn hàng</Link>
                      <div className="h-px bg-lumiere-gray/10 my-1 mx-2"></div>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-[11px] uppercase tracking-wider text-lumiere-terracotta">Đăng xuất</button>
                    </>
                  ) : (
                    <Link to="/auth" className="block px-4 py-2 text-[11px] uppercase tracking-wider text-lumiere-gray hover:text-lumiere-charcoal">Đăng nhập</Link>
                  )}
                </div>
              )}
            </div>

            <Link to="/cart" className="nav-link relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-lumiere-terracotta text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[150] bg-lumiere-cream transition-transform duration-500 flex flex-col p-12 pt-24 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button className="absolute top-8 right-8 text-2xl" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        <Link to="/" className="text-4xl serif font-light py-4 border-b border-lumiere-gray/15 hover:text-lumiere-terracotta" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
        <Link to="/products" className="text-4xl serif font-light py-4 border-b border-lumiere-gray/15 hover:text-lumiere-terracotta" onClick={() => setIsMobileMenuOpen(false)}>Sản phẩm</Link>
        <div className="mt-auto">
          <p className="text-[11px] tracking-widest text-lumiere-gray uppercase">© 2024 CLOTHING STORE. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </>
  );
}
