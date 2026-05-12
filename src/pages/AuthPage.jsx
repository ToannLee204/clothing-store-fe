import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CART_STORAGE_KEY,
  emitAuthUpdated,
  readGuestCart,
  saveCartSnapshotCount,
} from '../utils/cart';
import { parseResponseBody, extractMessage } from '../api/http';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const API_BASE_URL = '/api/v1/auth';
const API_CART_URL = '/api/v1/cart';

const sumCartCount = (items) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

const fetchBackendCartSnapshot = async (token) => {
  const response = await fetch(API_CART_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(extractMessage(payload, 'Không thể tải giỏ hàng sau khi đăng nhập.'));
  }

  const data = payload?.data ?? payload;
  const backendCount = sumCartCount(data?.items);
  saveCartSnapshotCount(backendCount);
  return { backendCount, data };
};

async function mergeGuestCartAfterLogin(token) {
  const guestItems = readGuestCart();
  let mergedCount = 0;

  try {
    if (guestItems.length > 0) {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      for (const item of guestItems) {
        const response = await fetch(`${API_CART_URL}/items`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            variantId: String(item.variantId),
            quantity: Number(item.quantity) || 1,
          }),
        });

        const payload = await parseResponseBody(response);

        if (!response.ok) {
          throw new Error(
            extractMessage(
              payload,
              `Không thể đồng bộ sản phẩm ${item.productName || item.variantId}.`
            )
          );
        }

        mergedCount += Number(item.quantity) || 0;
      }
    }

    const { backendCount, data } = await fetchBackendCartSnapshot(token);

    if (guestItems.length > 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    return {
      backendCount,
      backendCart: data,
      guestCount: guestItems.length,
      mergedCount,
      mergeFailed: false,
    };
  } catch (error) {
    console.error('Không thể đồng bộ giỏ hàng tạm:', error);
    return {
      backendCount: 0,
      backendCart: null,
      guestCount: guestItems.length,
      mergedCount,
      mergeFailed: true,
      message: error?.message || 'Không thể đồng bộ giỏ hàng tạm.',
    };
  }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (loginData) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.matKhau }),
      });

      const res = await parseResponseBody(response);
      console.log('Login Response:', { status: response.status, data: res });

      if (response.ok) {
        const token = res.accessToken || (res.data && res.data.accessToken);
        const user = res.user || (res.data && res.data.user);
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          const mergeResult = await mergeGuestCartAfterLogin(token);

          emitAuthUpdated({
            source: 'login',
            user,
            token,
            backendCount: mergeResult.backendCount,
            guestCount: mergeResult.guestCount,
            mergedCount: mergeResult.mergedCount,
            mergeFailed: mergeResult.mergeFailed,
          });

          const role = user && user.role ? user.role.toUpperCase() : '';
          if (role.includes('ADMIN')) navigate('/admin');
          else navigate('/');
        } else {
          setError('Không tìm thấy Token trong phản hồi từ Server!');
        }
      } else {
        const errorMsg = extractMessage(res, 'Đăng nhập thất bại!');
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
    }
  };

  const handleRegister = async (regData, confirmPassword) => {
    setError('');
    if (regData.matKhau !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: regData.hoTen, 
          email: regData.email, 
          password: regData.matKhau, 
          ngaySinh: regData.ngaySinh, 
          gioiTinh: regData.gioiTinh, 
          soDienThoai: regData.soDienThoai 
        }),
      });

      const res = await parseResponseBody(response);
      console.log('Register Response:', { status: response.status, data: res });

      if (response.ok) {
        alert('Đăng ký thành công, vui lòng kiểm tra email để xác thực!');
        setIsLogin(true);
      } else {
        const errData = res.data || res;
        if (errData.fullName) setError('Lỗi họ tên: ' + errData.fullName);
        else if (errData.email) setError('Lỗi email: ' + errData.email);
        else if (errData.password) setError('Lỗi mật khẩu: ' + errData.password);
        else {
          setError(extractMessage(res, 'Đăng ký thất bại!'));
        }
      }
    } catch (err) {
      console.error('Register error details:', err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
    }
  };

  return (
    <div className="min-h-screen bg-lumiere-cream flex">
      {/* Nút Back về Home */}
      <div className="absolute top-8 left-8 z-50">
        <Link
          to="/"
          className="group flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase font-bold text-lumiere-charcoal hover:text-lumiere-terracotta transition-all"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">west</span>
          Trở lại cửa hàng
        </Link>
      </div>

      {/* CỘT TRÁI: HÌNH ẢNH (Premium Sidebar) */}
      <div className="hidden lg:flex w-2/5 relative bg-lumiere-charcoal items-end justify-start p-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="CLOTHING STORE Fashion"
            className="h-full w-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lumiere-charcoal via-lumiere-charcoal/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-md animate-slide-up">
          <div className="serif text-white text-[120px] leading-none mb-8 opacity-10 select-none pointer-events-none absolute -top-32 -left-10">L</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-lumiere-terracotta animate-pulse"></span>
            CLOTHING STORE COLLECTION 2026
          </div>
          <h1 className="serif text-5xl text-white leading-tight mb-6">
            Khám phá tinh hoa<br />phong cách.
          </h1>
          <p className="text-white/60 text-sm font-medium leading-relaxed tracking-wide">
            Đăng nhập để trải nghiệm đặc quyền dành riêng cho thành viên của CLOTHING STORE, nhận thông tin về các bộ sưu tập giới hạn sớm nhất.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: FORM (Minimalist Form) */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 sm:p-20 relative">
        <div className="absolute top-12 right-12 serif text-[14px] text-lumiere-charcoal/40 hidden md:block">
          EST. 2026 — PREMIUM QUALITY
        </div>
        
        <div className="w-full max-w-xl">
          {/* Header Form */}
          <div className="mb-12">
            <Link to="/" className="serif text-4xl text-lumiere-charcoal mb-10 block tracking-tighter">
              CLOTHING STORE<span className="text-lumiere-terracotta">.</span>
            </Link>
            <h2 className="serif text-3xl text-lumiere-charcoal mb-3">
              {isLogin ? 'Chào mừng trở lại' : 'Tạo hành trình mới'}
            </h2>
            <p className="text-lumiere-gray text-[14px] leading-relaxed">
              {isLogin
                ? 'Vui lòng điền thông tin bên dưới để tiếp tục hành trình mua sắm.'
                : 'Tham gia cùng cộng đồng CLOTHING STORE để nhận nhiều ưu đãi độc quyền.'}
            </p>
          </div>

          {/* Nút Tab Chuyển đổi (Premium Tabs) */}
          <div className="flex border-b border-lumiere-gray/10 mb-10">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`pb-4 px-8 text-[11px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${isLogin ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-4 px-8 text-[11px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${!isLogin ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'}`}
            >
              Đăng ký
            </button>
          </div>

          {/* Thông báo Lỗi */}
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 flex items-start gap-4 animate-shake">
              <span className="material-symbols-outlined text-rose-500 mt-0.5">error</span>
              <p className="text-[13px] text-rose-600 serif italic font-medium">{error}</p>
            </div>
          )}

          {/* FORM */}
          <div className="animate-fade-in">
            {isLogin ? (
              <LoginForm onSubmit={handleLogin} />
            ) : (
              <RegisterForm onSubmit={handleRegister} />
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-lumiere-gray/5 text-center lg:text-left">
             <p className="text-[11px] text-lumiere-gray leading-relaxed uppercase tracking-widest">
                © 2026 CLOTHING STORE. ALL RIGHTS RESERVED.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
