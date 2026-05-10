import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (!t) {
      setError('Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại liên kết đặt lại mật khẩu.');
    } else {
      setToken(t);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn hoặc không hợp lệ.');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lumiere-cream flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-lumiere-gray/15 p-10 lg:p-14 text-center shadow-2xl animate-slide-up">
        <Link to="/" className="serif text-3xl text-lumiere-charcoal mb-8 block tracking-tighter">
          LUMIÈRE<span className="text-lumiere-terracotta">.</span>
        </Link>

        <h1 className="serif text-2xl text-lumiere-charcoal mb-4">Đặt lại mật khẩu</h1>
        
        {success ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px] text-emerald-500">check_circle</span>
            </div>
            <p className="text-[14px] text-lumiere-charcoal leading-relaxed">
              Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <Link
              to="/auth"
              className="inline-block w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all"
            >
              Đến trang Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-lumiere-gray mb-8 leading-relaxed">
              Nhập mật khẩu mới của bạn bên dưới. Vui lòng đảm bảo mật khẩu mới đủ mạnh.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-2 block">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none transition-all placeholder:text-lumiere-gray/40 focus:border-lumiere-charcoal focus:bg-white"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-2 block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none transition-all placeholder:text-lumiere-gray/40 focus:border-lumiere-charcoal focus:bg-white"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              {error && (
                <p className="text-[13px] text-rose-600 serif italic">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/10 disabled:opacity-50"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
