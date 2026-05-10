import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess(true);
        setMessage('Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (và cả hòm thư rác).');
      } else {
        setError(data.message || 'Có lỗi xảy ra khi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.');
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
        
        <h1 className="serif text-2xl text-lumiere-charcoal mb-4">Quên mật khẩu?</h1>
        <p className="text-[13px] text-lumiere-gray mb-8 leading-relaxed">
          Nhập email của bạn và chúng tôi sẽ gửi một liên kết để bạn có thể đặt lại mật khẩu của mình.
        </p>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-[13px] text-emerald-700 italic serif">
              {message}
            </div>
            <Link
              to="/auth"
              className="inline-block w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-2 block">Địa chỉ Email</label>
              <input
                type="email"
                required
                className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none transition-all placeholder:text-lumiere-gray/40 focus:border-lumiere-charcoal focus:bg-white"
                placeholder="example@lumiere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-[13px] text-rose-600 serif italic">{error}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/10 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </div>

            <div className="text-center pt-4">
              <Link to="/auth" className="text-[11px] tracking-widest uppercase font-bold text-lumiere-gray hover:text-lumiere-charcoal transition-all">
                Hủy và quay lại
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
