import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user từ LocalStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse thông tin user");
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* TRUYỀN PROPS CHO SIDEBAR */}
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} currentUser={user} />

      {/* VÙNG NỘI DUNG CO GIÃN */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        
        {/* TRUYỀN PROPS CHO HEADER */}
        <AdminHeader isCollapsed={isCollapsed} user={user} />
        
        <div className="p-0">
          <Outlet /> {/* Vùng render nội dung các trang (Products, Categories...) */}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;