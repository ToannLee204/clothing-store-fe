import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// NHẬN 3 PROPS TỪ LAYOUT
export default function AdminSidebar({ isCollapsed, setIsCollapsed, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  const menuItems = [
    { path: '/admin', icon: 'dashboard', label: 'Bảng điều khiển' },
    { path: '/admin/products', icon: 'inventory_2', label: 'Quản lý Sản phẩm' },
    { path: '/admin/categories', icon: 'category', label: 'Quản lý Danh mục' },
    { path: '/admin/vouchers', icon: 'local_offer', label: 'Quản lý Voucher' },
    { path: '/admin/orders', icon: 'shopping_cart', label: 'Quản lý Đơn hàng' },
    { path: '/admin/customers', icon: 'group', label: 'Quản lý Khách hàng' },
    { path: '/admin/reports', icon: 'bar_chart', label: 'Báo cáo & Thống kê' },
    { path: '/admin/settings', icon: 'settings', label: 'Cài đặt hệ thống' },
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
            <div className="size-8 bg-[#ec5b13] flex items-center justify-center rounded-xl text-white shadow-md shadow-[#ec5b13]/20 flex-shrink-0">
              <span className="material-symbols-outlined text-xl font-light">diamond</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Lumina</h1>
          </div>
        )}
        
        {/* Nút Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} // Dùng đúng props được truyền vào
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
          const isSettings = item.path === '/admin/settings';

          const content = (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center py-3 transition-all rounded-xl overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'
              } ${
                isActive
                  ? 'bg-[#ec5b13]/10 text-[#ec5b13] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#ec5b13] font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          );

          return isSettings ? (
            <div key={item.path} className="pt-4 mt-4 border-t border-slate-100">
              {content}
            </div>
          ) : (
            <React.Fragment key={item.path}>{content}</React.Fragment>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 bg-white">
        <div 
          className={`flex items-center p-2 bg-slate-50 rounded-xl group cursor-pointer hover:bg-red-50 transition-colors ${
            isCollapsed ? 'justify-center' : 'gap-3'
          }`}
          onClick={handleLogout}
          title={isCollapsed ? "Đăng xuất" : ""}
        >
          <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden flex-shrink-0 border-2 border-white group-hover:border-red-100 transition-colors">
             <span className="material-symbols-outlined">person</span>
          </div>
          
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-900 group-hover:text-red-700 transition-colors">
                  {currentUser?.fullName || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-semibold mt-0.5">
                  {currentUser?.role || 'Quản lý'}
                </p>
              </div>
              <button className="flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}