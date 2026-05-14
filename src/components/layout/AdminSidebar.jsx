import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../../utils/format';

export default function AdminSidebar({ isCollapsed, setIsCollapsed, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  const menuItems = [
    { path: '/admin', icon: 'bar_chart', label: 'Báo cáo & Thống kê' },
    { path: '/admin/customers', icon: 'group', label: 'Quản lý Khách hàng' },
    { path: '/admin/products', icon: 'inventory_2', label: 'Quản lý Sản phẩm' },
    { path: '/admin/categories', icon: 'category', label: 'Quản lý Danh mục' },
    { path: '/admin/vouchers', icon: 'local_offer', label: 'Quản lý Voucher' },
    { path: '/admin/orders', icon: 'shopping_cart', label: 'Quản lý Đơn hàng' },
    { path: '/admin/invoices', icon: 'receipt', label: 'Quản lý Hóa đơn' },
  ];

  return (
    <aside 
      className={`h-screen fixed left-0 top-0 flex flex-col bg-white border-r border-slate-200 z-50 font-sans transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`p-4 flex items-center h-20 border-b border-slate-50 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-8 bg-[#0066A2] flex items-center justify-center rounded-xl text-white shadow-md shadow-[#0066A2]/20 flex-shrink-0">
              <span className="material-symbols-outlined text-xl font-light">diamond</span>
            </div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900 uppercase whitespace-nowrap">
              Clothing Store
            </h1>
          </div>
        )}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && (item.path !== '/admin' || location.pathname === '/admin');

          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center py-3 transition-all rounded-xl overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'
              } ${
                isActive
                  ? 'bg-[#0066A2]/10 text-[#0066A2] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#0066A2] font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 bg-white relative" ref={dropdownRef}>
        {/* Dropdown Menu */}
        {!isCollapsed && showDropdown && (
          <div className="absolute bottom-full right-2 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => { navigate('/admin/profile'); setShowDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              Thông tin cá nhân
            </button>
            <button 
              onClick={() => { navigate('/admin/change-password'); setShowDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
              Đổi mật khẩu
            </button>
            <div className="h-px bg-slate-100 mx-2"></div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Đăng xuất
            </button>
          </div>
        )}

        <div 
          className={`flex items-center p-2 bg-slate-50 rounded-xl group cursor-pointer transition-colors relative ${
            isCollapsed ? 'justify-center' : 'gap-3'
          } ${showDropdown ? 'ring-2 ring-[#0066A2]/20 bg-white shadow-sm' : 'hover:bg-slate-100'}`}
          onClick={() => setShowDropdown(!showDropdown)}
          title={isCollapsed ? "Cài đặt tài khoản" : ""}
        >
          <div className="size-10 rounded-full bg-[#0066A2]/10 flex items-center justify-center text-[#0066A2] overflow-hidden flex-shrink-0 border-2 border-white group-hover:border-[#0066A2]/10 transition-colors font-bold">
             {currentUser?.avatar ? (
               <img src={getImageUrl(currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               currentUser?.fullName?.charAt(0) || 'A'
             )}
          </div>
          
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-900">
                  {currentUser?.fullName || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-semibold mt-0.5">
                  {currentUser?.role || 'Quản lý'}
                </p>
              </div>
              <button className="flex items-center justify-center text-slate-400 group-hover:text-[#0066A2] transition-colors">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}