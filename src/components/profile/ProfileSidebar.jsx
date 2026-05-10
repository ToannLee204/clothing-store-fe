import React from 'react';

export default function ProfileSidebar({ user, activeTab, onTabChange, onLogout }) {
  const menuItems = [
    { id: 'personal-info', label: 'Hồ sơ cá nhân', icon: 'account_circle' },
    { id: 'addresses', label: 'Quản lý địa chỉ', icon: 'location_on' },
    { id: 'reviews', label: 'Đánh giá sản phẩm', icon: 'star' },
    { id: 'password', label: 'Đổi mật khẩu', icon: 'lock' },
    { id: 'orders', label: 'Lịch sử đơn hàng', icon: 'shopping_bag' },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white border border-lumiere-gray/15 p-8">
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-lumiere-gray/10">
          <div className="w-14 h-14 rounded-full bg-lumiere-blush flex items-center justify-center text-lumiere-terracotta serif text-xl font-medium">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-lumiere-charcoal">{user.fullName}</p>
            <p className="text-[11px] tracking-wider text-lumiere-gray uppercase mt-0.5">Thành viên vàng</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-4 px-4 py-3.5 transition-all text-[13px] font-medium tracking-wide ${
                activeTab === item.id 
                  ? 'bg-lumiere-charcoal text-white' 
                  : 'text-lumiere-gray hover:text-lumiere-charcoal hover:bg-lumiere-blush/30'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
          
          <div className="h-px bg-lumiere-gray/10 my-4" />
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3.5 text-lumiere-terracotta hover:bg-red-50 transition-all text-[13px] font-medium tracking-wide"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Đăng xuất
          </button>
        </nav>
      </div>
    </aside>
  );
}
