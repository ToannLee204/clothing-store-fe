import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CART_STORAGE_KEY,
  emitAuthUpdated,
  readGuestCart,
  saveCartSnapshotCount,
} from '../utils/cart';

function EyeIcon({ hidden = false }) {
  return (
    <span className="material-symbols-outlined text-[18px]">
      {hidden ? 'visibility_off' : 'visibility'}
    </span>
  );
}

const API_BASE_URL = '/api/v1/auth';
const API_CART_URL = '/api/v1/cart';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
};

const sumCartCount = (items) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

const fetchBackendCartSnapshot = async (token) => {
  const response = await fetch(API_CART_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  // --- LOGIC STATES (GIỮ NGUYÊN 100%) ---
  const [loginData, setLoginData] = useState({ email: '', matKhau: '' });
  const [regData, setRegData] = useState({
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 1,
    email: '',
    matKhau: '',
    soDienThoai: '',
    vaiTro: 'user',
    trangThai: 1,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- HANDLERS (GIỮ NGUYÊN 100%) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.matKhau }),
      });
      const res = await response.json();
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

          alert(
            mergeResult.mergeFailed
              ? 'Đăng nhập thành công, nhưng chưa thể đồng bộ giỏ hàng tạm.'
              : mergeResult.guestCount > 0
                ? 'Đăng nhập thành công! Giỏ hàng tạm đã được đồng bộ.'
                : 'Đăng nhập thành công!'
          );

          const role = user && user.role ? user.role.toUpperCase() : '';
          if (role.includes('ADMIN')) navigate('/admin');
          else navigate('/');
        } else {
          setError('Không tìm thấy Token trong phản hồi từ Server!');
        }
      } else {
        setError(res.message || 'Đăng nhập thất bại!');
      }
    } catch (err) {
      setError('Lỗi kết nối Server!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regData.matKhau !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: regData.hoTen, email: regData.email, password: regData.matKhau }),
      });
      const textData = await response.text();
      let res;
      try {
        res = JSON.parse(textData);
      } catch (e) {
        res = { message: textData };
      }

      if (response.ok) {
        alert('Đăng ký thành công, vui lòng đăng nhập!');
        setIsLogin(true);
        setRegData({
          hoTen: '',
          ngaySinh: '',
          gioiTinh: 1,
          email: '',
          matKhau: '',
          soDienThoai: '',
          vaiTro: 'user',
          trangThai: 1,
        });
        setConfirmPassword('');
      } else {
        const errData = res.data || res;
        if (errData.fullName) setError('Lỗi họ tên: ' + errData.fullName);
        else if (errData.email) setError('Lỗi email: ' + errData.email);
        else if (errData.password) setError('Lỗi mật khẩu: ' + errData.password);
        else if (typeof res.message === 'string') setError(res.message);
        else setError(JSON.stringify(errData));
      }
    } catch (err) {
      setError('Không thể kết nối đến Server Backend!');
    }
  };

  // --- STYLE CHUẨN UI/UX ---
  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-medium';
  const labelBase = 'mb-1.5 block text-sm font-bold text-slate-700';
  const formButtonBase =
    'w-full rounded-xl bg-[#ec5b13] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#ec5b13]/20 transition-all hover:bg-[#d95210] hover:-translate-y-0.5';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex">
      {/* Nút Back về Home */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#ec5b13] transition-colors bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-100"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Trở lại cửa hàng
        </Link>
      </div>

      {/* CỘT TRÁI: HÌNH ẢNH (Ẩn trên mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-950 items-end justify-start p-12">
        <div className="absolute inset-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNXzF9oiSuQAE-88sBApihNmVDa1IHGI_KMHRKsUCzuQTLqfAAYfEs_DHdDyjrYilOlso32UyhLXz6G5Qbfegii9eZlV1x16QJ6oFpYe5NtIaI1icwIu60z_vehxMn5Nz8klxJRxx2f9ICHHUaapNoDr_vXYZbxDt2f0TS6VzhyP2AdvdI2TEBKEW8F-YOxP1hs4tFAIYACY3wFgfP-pgaFS0sknhPiTxadSca98KBvmH10wyyTb9f3_KpkTFgFKdXYl6Aj0dDOM"
            alt="Fashion Editorial"
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur mb-6">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Lumina 2026
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
            Định hình<br />phong cách của bạn.
          </h1>
          <p className="text-slate-300 text-lg font-medium leading-relaxed">
            Đăng nhập để trải nghiệm mua sắm cá nhân hóa, lưu giữ giỏ hàng và nhận vô vàn ưu đãi đặc quyền từ Lumina.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-xl mb-6 shadow-md">
              LU
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              {isLogin
                ? 'Nhập thông tin của bạn để tiếp tục mua sắm.'
                : 'Tham gia cùng chúng tôi để nhận nhiều ưu đãi hấp dẫn.'}
            </p>
          </div>

          {/* Nút Tab Chuyển đổi */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đăng ký
            </button>
          </div>

          {/* Thông báo Lỗi */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-600">
              <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
              <p className="text-sm font-medium pt-0.5">{error}</p>
            </div>
          )}

          {/* FORM ĐĂNG NHẬP */}
          {isLogin ? (
            <form className="space-y-5 animate-fade-in" onSubmit={handleLogin}>
              <div>
                <label className={labelBase}>Email</label>
                <input
                  className={inputBase}
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="VD: you@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="text-sm font-bold text-slate-700 block">Mật khẩu</label>
                  <a href="#" className="text-xs font-bold text-[#ec5b13] hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className={`${inputBase} pr-12`}
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginData.matKhau}
                    onChange={(e) => setLoginData({ ...loginData, matKhau: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ec5b13] transition-colors p-1"
                  >
                    <EyeIcon hidden={showLoginPassword} />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className={formButtonBase}>
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          ) : (
            /* FORM ĐĂNG KÝ */
            <form className="space-y-5 animate-fade-in" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Họ tên</label>
                  <input
                    className={inputBase}
                    type="text"
                    value={regData.hoTen}
                    onChange={(e) => setRegData({ ...regData, hoTen: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className={labelBase}>Số điện thoại</label>
                  <input
                    className={inputBase}
                    type="tel"
                    value={regData.soDienThoai}
                    onChange={(e) => setRegData({ ...regData, soDienThoai: e.target.value })}
                    placeholder="0987654321"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Ngày sinh</label>
                  <input
                    className={inputBase}
                    type="date"
                    value={regData.ngaySinh}
                    onChange={(e) => setRegData({ ...regData, ngaySinh: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelBase}>Giới tính</label>
                  <select
                    className={inputBase}
                    value={regData.gioiTinh}
                    onChange={(e) => setRegData({ ...regData, gioiTinh: parseInt(e.target.value) })}
                  >
                    <option value="0">Nam</option>
                    <option value="1">Nữ</option>
                    <option value="2">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelBase}>Email</label>
                <input
                  className={inputBase}
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Mật khẩu</label>
                  <div className="relative">
                    <input
                      className={`${inputBase} pr-10`}
                      type={showRegPassword ? 'text' : 'password'}
                      value={regData.matKhau}
                      onChange={(e) => setRegData({ ...regData, matKhau: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ec5b13] p-1"
                    >
                      <EyeIcon hidden={showRegPassword} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelBase}>Xác nhận</label>
                  <div className="relative">
                    <input
                      className={`${inputBase} pr-10`}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ec5b13] p-1"
                    >
                      <EyeIcon hidden={showConfirmPassword} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className={formButtonBase}>
                  Tạo tài khoản
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
