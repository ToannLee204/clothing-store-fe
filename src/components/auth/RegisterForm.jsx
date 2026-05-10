import { useState } from 'react';

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

export default function RegisterForm({ onSubmit }) {
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
    <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelBase}>Họ và tên</label>
          <input
            className={inputBase}
            type="text"
            value={regData.hoTen}
            onChange={(e) => setRegData({ ...regData, hoTen: e.target.value })}
            placeholder="VD: Nguyễn Văn A"
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
            placeholder="VD: 0912 345 678"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        <label className={labelBase}>Địa chỉ Email</label>
        <input
          className={inputBase}
          type="email"
          value={regData.email}
          onChange={(e) => setRegData({ ...regData, email: e.target.value })}
          placeholder="example@lumiere.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelBase}>Mật khẩu</label>
          <div className="relative">
            <input
              className={`${inputBase} pr-12`}
              type={showRegPassword ? 'text' : 'password'}
              value={regData.matKhau}
              onChange={(e) => setRegData({ ...regData, matKhau: e.target.value })}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
            >
              <EyeIcon hidden={showRegPassword} />
            </button>
          </div>
        </div>
        <div>
          <label className={labelBase}>Xác nhận</label>
          <div className="relative">
            <input
              className={`${inputBase} pr-12`}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lumiere-gray hover:text-lumiere-charcoal p-1"
            >
              <EyeIcon hidden={showConfirmPassword} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" className={formButtonBase}>
          Tạo tài khoản mới
        </button>
      </div>
    </form>
  );
}
