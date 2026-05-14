import React, { useState } from 'react';
import { authHeaders, extractMessage, parseResponseBody } from '../../api/http';

export default function PersonalInfoForm({ user, token }) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || user?.soDienThoai || '',
    dateOfBirth: user?.dateOfBirth || user?.ngaySinh || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) return "Họ tên không được để trống";
    if (formData.fullName.length > 50) return "Họ tên không vượt quá 50 ký tự";
    
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) return "Ngày sinh phải là ngày trong quá khứ";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formData)
      });

      const payload = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(extractMessage(payload, 'Không thể cập nhật hồ sơ'));
      }

      // Cập nhật thành công
      const updatedUser = payload?.data ?? payload;
      
      // Đồng bộ lại localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      
      // Kích hoạt sự kiện để đồng bộ UI (ProfilePage, Header...)
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12 animate-fade-in">
      <div className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Hồ sơ cá nhân</h2>
        <p className="text-[13px] text-lumiere-gray">Cập nhật thông tin cá nhân và quản lý tài khoản của bạn.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray">Họ và tên</label>
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray">Địa chỉ Email</label>
          <input 
            type="email" 
            disabled
            value={user?.email || ''}
            className="w-full bg-lumiere-gray/5 border border-lumiere-gray/10 px-4 py-3 text-[14px] text-lumiere-gray cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray">Số điện thoại</label>
          <input 
            type="tel" 
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray">Ngày sinh</label>
          <input 
            type="date" 
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full bg-lumiere-cream/30 border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
          />
        </div>

        {message.text && (
          <div className={`md:col-span-2 p-4 text-[13px] serif italic ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        <div className="md:col-span-2 pt-6">
          <button 
            type="submit"
            disabled={loading}
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-bold px-10 py-4 hover:bg-lumiere-terracotta transition-all disabled:opacity-50 shadow-xl shadow-lumiere-charcoal/10"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
