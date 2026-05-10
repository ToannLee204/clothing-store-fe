import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực. Vui lòng kiểm tra lại đường dẫn trong email của bạn.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/v1/auth/verify-email?token=${token}`, {
          method: 'GET', // Or POST depending on backend, assumed GET for standard verify link
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
          setStatus('success');
          setMessage('Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.');
        } else {
          setStatus('error');
          setMessage(data?.message || 'Xác thực email thất bại hoặc mã xác thực đã hết hạn.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
      }
    };

    verifyEmail();
  }, [location]);

  return (
    <div className="min-h-screen bg-lumiere-cream flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-lumiere-gray/15 p-10 lg:p-14 text-center shadow-2xl animate-slide-up">
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-lumiere-terracotta border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h1 className="serif text-2xl text-lumiere-charcoal">Đang xác thực...</h1>
            <p className="text-[13px] text-lumiere-gray leading-relaxed">
              Vui lòng đợi trong giây lát, chúng tôi đang kiểm tra mã xác thực của bạn.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[40px] text-emerald-500">check_circle</span>
            </div>
            <h1 className="serif text-3xl text-lumiere-charcoal">Thành công!</h1>
            <p className="text-[14px] text-lumiere-charcoal leading-relaxed">
              {message}
            </p>
            <div className="pt-6">
              <Link
                to="/auth"
                className="inline-block w-full bg-lumiere-charcoal text-white text-[12px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all"
              >
                Đến trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[40px] text-rose-500">error</span>
            </div>
            <h1 className="serif text-3xl text-lumiere-charcoal">Xác thực thất bại</h1>
            <p className="text-[14px] text-rose-600 leading-relaxed italic">
              {message}
            </p>
            <div className="pt-6 space-y-4">
              <Link
                to="/auth"
                className="inline-block w-full bg-white border border-lumiere-charcoal text-lumiere-charcoal text-[12px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-charcoal hover:text-white transition-all"
              >
                Quay lại Đăng nhập
              </Link>
              <Link
                to="/"
                className="inline-block text-[11px] tracking-widest uppercase text-lumiere-gray hover:text-lumiere-charcoal underline transition-all"
              >
                Về Trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
