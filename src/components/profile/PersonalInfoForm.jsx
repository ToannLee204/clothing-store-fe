import React from 'react';

export default function PersonalInfoForm({ user }) {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12">
      <div className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Hồ sơ cá nhân</h2>
        <p className="text-[13px] text-lumiere-gray">Cập nhật thông tin cá nhân và quản lý tài khoản của bạn.</p>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Họ và tên</label>
          <input 
            type="text" 
            defaultValue={user.fullName}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Địa chỉ Email</label>
          <input 
            type="email" 
            disabled
            defaultValue={user.email}
            className="w-full bg-lumiere-gray/5 border border-lumiere-gray/10 px-4 py-3 text-[14px] text-lumiere-gray cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Số điện thoại</label>
          <input 
            type="tel" 
            defaultValue={user.soDienThoai}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Ngày sinh</label>
          <input 
            type="date" 
            defaultValue={user.ngaySinh}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>

        <div className="md:col-span-2 pt-6">
          <button 
            type="button"
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-10 py-4 hover:bg-lumiere-terracotta transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
