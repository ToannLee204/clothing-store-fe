import { useState } from 'react';

function EyeIcon({ hidden = false }) {
  return (
    <span className="material-symbols-outlined text-[18px]">
      {hidden ? 'visibility_off' : 'visibility'}
    </span>
  );
}

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#0066A2] focus:ring-2 focus:ring-[#0066A2]/20 font-medium';
const labelBase = 'mb-1.5 block text-sm font-bold text-slate-700';
const formButtonBase =
  'w-full rounded-xl bg-[#0066A2] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0066A2]/20 transition-all hover:bg-[#005587] hover:-translate-y-0.5';

export default function LoginForm({ onSubmit, error }) {
  const [loginData, setLoginData] = useState({ email: '', matKhau: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(loginData);
  };

  return (
    <form className="space-y-5 animate-fade-in" onSubmit={handleSubmit}>
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
          <a href="#" className="text-xs font-bold text-[#0066A2] hover:underline">
            Quên mật khẩu?
          </a>
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0066A2] transition-colors p-1"
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" className={formButtonBase}>
          Đăng nhập ngay
        </button>
      </div>
    </form>
  );
}
