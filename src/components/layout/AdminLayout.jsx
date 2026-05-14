import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  const loadUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse thông tin user");
      }
    }
  };

  useEffect(() => {
    loadUser();
    
    // Lắng nghe thay đổi từ storage (khi AdminProfile cập nhật)
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* TRUYỀN PROPS CHO SIDEBAR */}
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} currentUser={user} />

      {/* VÙNG NỘI DUNG CO GIÃN */}
      <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        
        {/* VÙNG NỘI DUNG CHÍNH */}
        
        <div className="min-w-0 p-0">
          <Outlet /> {/* Vùng render nội dung các trang (Products, Categories...) */}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
