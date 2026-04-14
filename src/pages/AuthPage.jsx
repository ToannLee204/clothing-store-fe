import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const API_BASE_URL = '/api/v1/auth';

  const [loginData, setLoginData] = useState({ 
    email: '', 
    matKhau: '' 
  });

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: loginData.email,
            password: loginData.matKhau
        })
      });

      const res = await response.json();

      if (response.ok) {
        alert('Đăng nhập thành công!');
        const actualData = res.data;
        localStorage.setItem('token', actualData.accessToken);
        localStorage.setItem('user', JSON.stringify(actualData.user));
        
        if (actualData.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }

      } else {
        const errData = res.data || res;
        if (errData.password) {
            setError('Lỗi mật khẩu: ' + errData.password);
        } else if (typeof res.message === 'string') {
            setError(res.message);
        } else {
            setError(JSON.stringify(errData));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến Server Backend!');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: regData.hoTen,
          email: regData.email,
          password: regData.matKhau
        })
      });

      const textData = await response.text();
      let res;
      try {
        res = JSON.parse(textData);
      } catch(e) {
        res = { message: textData };
      }

      if (response.ok) {
        alert('Đăng ký thành công, vui lòng đăng nhập!');
        setIsLogin(true);
        setRegData({ hoTen: '', ngaySinh: '', gioiTinh: 1, email: '', matKhau: '', soDienThoai: '', vaiTro: 'user', trangThai: 1});
        setConfirmPassword('');
      } else {
        const errData = res.data || res;
        if (errData.fullName) {
            setError('Lỗi họ tên: ' + errData.fullName);
        } else if (errData.email) {
            setError('Lỗi email: ' + errData.email);
        } else if (errData.password) {
            setError('Lỗi mật khẩu: ' + errData.password);
        } else if (typeof res.message === 'string') {
            setError(res.message);
        } else {
            setError(JSON.stringify(errData)); 
        }
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến Server Backend!');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body selection:bg-secondary-container">
      {/* Ném CSS vào đây để tiêu diệt cái nền xanh Autofill, đéo cần mò file CSS ngoài */}
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
              transition: background-color 5000s ease-in-out 0s;
              -webkit-text-fill-color: inherit !important;
          }
        `}
      </style>

      <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/"><h1 className="text-2xl font-headline tracking-tight text-primary uppercase italic font-bold">FASHION STORE</h1></Link>
        </div>
        <div className="pointer-events-auto">
          <Link to="/" className="text-[0.6875rem] font-label uppercase tracking-[0.1rem] hover:text-secondary">Trở lại cửa hàng</Link>
        </div>
      </header>

      <main className="min-h-screen flex flex-col md:flex-row">
        <section className="hidden md:block w-1/2 h-screen relative overflow-hidden bg-surface-container-high">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNXzF9oiSuQAE-88sBApihNmVDa1IHGI_KMHRKsUCzuQTLqfAAYfEs_DHdDyjrYilOlso32UyhLXz6G5Qbfegii9eZlV1x16QJ6oFpYe5NtIaI1icwIu60z_vehxMn5Nz8klxJRxx2f9ICHHUaapNoDr_vJXYZbxDt2f0TS6VzhyP2AdvdI2TEBKEW8F-YOxP1hs4tFAIYACY3wFgfP-pgaFS0sknhPiTxadSca98KBvmH10wyyTb9f3_KpkTFgFKdXYl6Aj0dDOM" className="w-full h-full object-cover grayscale-[20%]" alt="Editorial" />
        </section>

        <section className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-24 md:px-24 bg-surface-container-low overflow-y-auto no-scrollbar">
          <div className="w-full max-w-md space-y-12">
            
            {error && <div className="p-4 bg-error-container text-error text-[10px] font-bold uppercase tracking-widest">{error}</div>}

            {isLogin ? (
              <div className="animate-fadeIn">
                <div className="space-y-2 mb-10">
                  <span className="text-[0.6875rem] font-label uppercase tracking-[0.15rem] text-secondary font-bold">Chào mừng trở lại</span>
                  <h2 className="text-4xl font-headline text-primary italic">Đăng nhập</h2>
                </div>
                <form className="space-y-10" onSubmit={handleLogin}>
                  <div className="relative group">
                    <input className="peer w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 px-0 focus:ring-0 focus:outline-none transition-all text-on-surface placeholder-transparent" type="email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} required />
                    <label className="absolute left-0 -top-3.5 text-on-surface-variant text-[0.6875rem] font-label uppercase tracking-wider transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[0.6875rem] peer-focus:text-primary">Địa chỉ Email</label>
                  </div>
                  
                  {/* Nút mắt đăng nhập */}
                  <div className="relative group">
                    <input className="peer w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 pr-8 pl-0 focus:ring-0 focus:outline-none transition-all text-on-surface placeholder-transparent" type={showLoginPassword ? "text" : "password"} value={loginData.matKhau} onChange={(e) => setLoginData({...loginData, matKhau: e.target.value})} required />
                    <label className="absolute left-0 -top-3.5 text-on-surface-variant text-[0.6875rem] font-label uppercase tracking-wider transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[0.6875rem] peer-focus:text-primary">Mật khẩu</label>
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{showLoginPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>

                  <button type="submit" className="w-full bg-black text-white py-5 text-[0.75rem] font-label uppercase tracking-[0.2rem] hover:bg-[#333]">ĐĂNG NHẬP</button>
                </form>
                <div className="mt-10 text-center"><button type="button" className="text-primary font-bold underline underline-offset-4 text-sm" onClick={() => setIsLogin(false)}>Tạo tài khoản mới</button></div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="space-y-2 mb-10">
                  <span className="text-[0.6875rem] font-label uppercase tracking-[0.15rem] text-secondary font-bold">Hành trình mới</span>
                  <h2 className="text-4xl font-headline text-primary italic">Đăng ký</h2>
                </div>
                <form className="space-y-6" onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="bg-transparent border-b border-outline-variant/30 py-3 focus:ring-0 focus:outline-none text-sm" type="text" placeholder="HỌ TÊN" value={regData.hoTen} onChange={(e) => setRegData({...regData, hoTen: e.target.value})} required />
                    <input className="bg-transparent border-b border-outline-variant/30 py-3 focus:ring-0 focus:outline-none text-sm" type="date" value={regData.ngaySinh} onChange={(e) => setRegData({...regData, ngaySinh: e.target.value})} required />
                  </div>
                  <select className="w-full bg-transparent border-b border-outline-variant/30 py-3 focus:ring-0 focus:outline-none text-sm text-on-surface-variant" value={regData.gioiTinh} onChange={(e) => setRegData({...regData, gioiTinh: parseInt(e.target.value)})}>
                    <option value="0">NAM</option>
                    <option value="1">NỮ</option>
                    <option value="2">KHÁC</option>
                  </select>
                  <input className="w-full bg-transparent border-b border-outline-variant/30 py-3 focus:ring-0 focus:outline-none text-sm" type="email" placeholder="ĐỊA CHỈ EMAIL" value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} required />
                  <input className="w-full bg-transparent border-b border-outline-variant/30 py-3 focus:ring-0 focus:outline-none text-sm" type="tel" placeholder="SỐ ĐIỆN THOẠI" value={regData.soDienThoai} onChange={(e) => setRegData({...regData, soDienThoai: e.target.value})} required />
                  
                  {/* Nút mắt đăng ký */}
                  <div className="relative">
                    <input className="w-full bg-transparent border-b border-outline-variant/30 py-3 pr-8 focus:ring-0 focus:outline-none text-sm" type={showRegPassword ? "text" : "password"} placeholder="MẬT KHẨU" value={regData.matKhau} onChange={(e) => setRegData({...regData, matKhau: e.target.value})} required />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{showRegPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>

                  {/* Nút mắt xác nhận mật khẩu */}
                  <div className="relative">
                    <input className="w-full bg-transparent border-b border-outline-variant/30 py-3 pr-8 focus:ring-0 focus:outline-none text-sm" type={showConfirmPassword ? "text" : "password"} placeholder="XÁC NHẬN MẬT KHẨU" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  
                  <button type="submit" className="w-full bg-black text-white py-5 text-[0.75rem] font-label uppercase tracking-[0.2rem]">TẠO TÀI KHOẢN</button>
                </form>
                <div className="mt-10 text-center"><button type="button" className="text-primary font-bold underline underline-offset-4 text-sm" onClick={() => setIsLogin(true)}>Đăng nhập ngay</button></div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}