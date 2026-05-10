import { useState } from 'react';
import { Link } from 'react-router-dom';

function EyeIcon({ hidden = false }) {
  return (
    <span className="material-symbols-outlined text-[20px]">
      {hidden ? 'visibility_off' : 'visibility'}
    </span>
  );
}

const inputBase =
  'w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3.5 text-[14px] text-lumiere-charcoal outline-none transition-all placeholder:text-lumiere-gray/50 focus:border-lumiere-charcoal focus:bg-white';
const labelBase = 'text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray mb-2 block';
const formButtonBase =
  'w-full bg-lumiere-charcoal text-white text-[12px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-lumiere-terracotta transition-all shadow-xl shadow-lumiere-charcoal/10 active:scale-[0.98]';

export default function LoginForm({ onSubmit }) {
  const [loginData, setLoginData] = useState({ email: '', matKhau: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(loginData);
  };

  return (
    <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
      <div>
        <label className={labelBase}>Địa chỉ Email</label>
        <input
          className={inputBase}
          type="email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          placeholder="example@lumiere.com"
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <label className={labelBase}>Mật khẩu</label>
          <Link to="/forgot-password" className="text-[10px] tracking-widest uppercase font-bold text-lumiere-terracotta hover:underline mb-2">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <input
            className={`${inputBase} pr-12`}
            type={showPassword ? 'text' : 'password'}
            value={loginData.matKhau}
            onChange={(e) => setLoginData({ ...loginData, matKhau: e.target.value })}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal transition-colors p-1"
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" className={formButtonBase}>
          Đăng nhập ngay
        </button>
      </div>
    </form>
  );
}
