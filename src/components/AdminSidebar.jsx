import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const menuItems = [
    { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/products', icon: 'inventory_2', label: 'Quản lý Sản phẩm' },
    { path: '/admin/orders', icon: 'shopping_bag', label: 'Quản lý Đơn hàng' },
    { path: '/admin/customers', icon: 'group', label: 'Quản lý Khách hàng' },
    { path: '/admin/invoices', icon: 'receipt_long', label: 'Quản lý Hóa đơn' },
    { path: '/admin/reports', icon: 'analytics', label: 'Báo cáo & Thống kê' },
    { path: '/admin/settings', icon: 'settings', label: 'Cài đặt hệ thống' },
  ];

  return (
    <aside className="h-screen w-72 fixed left-0 top-0 bg-[#FDF9F4] flex flex-col py-8 px-6 z-50 border-r border-outline-variant/10">
      <div className="mb-12">
        <h1 className="text-2xl font-serif italic text-[#1A1A1A]">FASHION STORE</h1>
        <p className="font-label text-[0.6875rem] tracking-widest uppercase mt-1 text-on-surface-variant opacity-60">System Administrator</p>
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 transition-all ${
              location.pathname === item.path
                ? 'text-[#1A1A1A] font-bold border-l-4 border-[#C8A882] bg-[#F1EDE8]'
                : 'text-[#735A39] opacity-80 hover:opacity-100 hover:bg-[#F1EDE8]'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body text-base">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-8 border-t border-outline-variant/15">
        {/* ĐÉO CÒN NÚT ĐEN SÌ NỮA NHÉ */}
        <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 text-[#735A39] opacity-80 hover:opacity-100 w-full group">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">logout</span>
          <span className="font-body text-base">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}