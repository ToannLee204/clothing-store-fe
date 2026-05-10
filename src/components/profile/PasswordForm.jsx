import React, { useState } from 'react';

export default function PasswordForm({ token }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.ok) {
        setMessage({ text: 'Đổi mật khẩu thành công.', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({ text: data.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12">
      <div className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Đổi mật khẩu</h2>
        <p className="text-[13px] text-lumiere-gray">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
      </div>

      {message.text && (
        <div className={`mb-8 p-4 border text-[13px] italic serif ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
          {message.text}
        </div>
      )}

      <form className="max-w-xl space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Mật khẩu hiện tại</label>
          <div className="relative">
            <input 
              type={showOldPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none focus:border-lumiere-charcoal transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showOldPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Mật khẩu mới</label>
            <div className="relative">
              <input 
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none focus:border-lumiere-charcoal transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none focus:border-lumiere-charcoal transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={loading}
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-10 py-4 hover:bg-lumiere-terracotta transition-all disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}
