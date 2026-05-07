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

export default function RegisterForm({ onSubmit, error }) {
  const [regData, setRegData] = useState({
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 1,
    email: '',
    matKhau: '',
    soDienThoai: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(regData, confirmPassword);
  };

  return (
    <form className="space-y-5 animate-fade-in" onSubmit={handleSubmit}>
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0066A2] p-1"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0066A2] p-1"
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
  );
}
