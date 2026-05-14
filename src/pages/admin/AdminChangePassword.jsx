import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseResponseBody, extractMessage, jsonAuthHeaders } from '../../api/http';
import './AdminProducts.css';

export default function AdminChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        })
      });

      const payload = await parseResponseBody(response);
      if (response.ok) {
        setSuccess('Đổi mật khẩu thành công!');
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => navigate('/admin'), 2000);
      } else {
        setError(extractMessage(payload, 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.'));
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Đổi mật khẩu</div>
            <div className="pm-subtitle">Cập nhật mật khẩu mới để bảo mật tài khoản của bạn.</div>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu hiện tại</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0066A2] transition-colors">lock_open</span>
                <input
                  required
                  type={showOld ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all"
                  placeholder="Nhập mật khẩu cũ"
                  value={form.oldPassword}
                  onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                />
                <button 
                  type="button" 
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showOld ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0066A2] transition-colors">lock</span>
                <input
                  required
                  type={showNew ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all"
                  placeholder="Ít nhất 6 ký tự"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Xác nhận mật khẩu mới</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0066A2] transition-colors">verified_user</span>
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all"
                  placeholder="Nhập lại mật khẩu mới"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirm ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-ghost px-8 py-3"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 py-3"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
