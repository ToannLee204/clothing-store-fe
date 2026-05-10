import React from 'react';

export default function PasswordForm() {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12">
      <div className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Đổi mật khẩu</h2>
        <p className="text-[13px] text-lumiere-gray">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
      </div>

      <form className="max-w-xl space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Mật khẩu hiện tại</label>
          <input 
            type="password" 
            placeholder="••••••••"
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Xác nhận mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
            />
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="button"
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-10 py-4 hover:bg-lumiere-terracotta transition-all"
          >
            Cập nhật mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
}
