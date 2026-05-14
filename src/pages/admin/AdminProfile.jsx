import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseResponseBody, extractMessage, jsonAuthHeaders, authHeaders } from '../../api/http';
import { getImageUrl } from '../../utils/format';
import './AdminProducts.css';

export default function AdminProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    role: '',
    avatar: '' // Keep in state for UI, but might not be in API
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: jsonAuthHeaders()
      });
      const payload = await parseResponseBody(response);
      if (response.ok) {
        const data = payload.data || payload;
        const userData = {
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          role: data.role || 'ADMIN',
          avatar: data.avatar || ''
        };
        setUser(userData);
        setAvatarPreview(data.avatar || '');
      }
    } catch (err) {
      setError('Không thể tải thông tin hồ sơ.');
    } finally {
      setFetching(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Update profile
      const response = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth
        })
      });

      const payload = await parseResponseBody(response);
      if (response.ok) {
        const data = payload.data || payload;
        setSuccess('Cập nhật thông tin thành công!');
        
        const updatedUserData = { 
          ...user, 
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          dateOfBirth: data.dateOfBirth
        };
        setUser(updatedUserData);
        
        // Update local storage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const finalUser = { ...storedUser, ...updatedUserData };
        localStorage.setItem('user', JSON.stringify(finalUser));
        
        window.dispatchEvent(new Event('storage')); 
      } else {
        setError(extractMessage(payload, 'Cập nhật thất bại.'));
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066A2]"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Thông tin cá nhân</div>
            <div className="pm-subtitle">Quản lý và cập nhật thông tin tài khoản quản trị của bạn.</div>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '40px' }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="size-24 rounded-full bg-[#0066A2]/10 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-[#0066A2] transition-transform group-hover:scale-105">
                  {avatarPreview ? (
                    <img src={getImageUrl(avatarPreview)} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    user.fullName?.charAt(0) || 'A'
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Ảnh đại diện</p>
                <p className="text-[11px] text-slate-400">Click vào ảnh để thay đổi</p>
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Họ và tên</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all font-medium"
                    value={user.fullName}
                    onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số điện thoại</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all font-medium"
                    value={user.phoneNumber}
                    onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày sinh</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 outline-none transition-all font-medium"
                    value={user.dateOfBirth}
                    onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email</label>
                  <input
                    disabled
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed font-medium"
                    value={user.email}
                  />
                  <p className="text-[11px] text-slate-400 italic">* Email dùng để đăng nhập, không thể thay đổi.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vai trò hệ thống</label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0066A2]/5 border border-[#0066A2]/10 text-[#0066A2] font-bold text-sm uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    {user.role}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-ghost px-10 py-3"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-10 py-3"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
