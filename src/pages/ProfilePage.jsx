import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DIA_CHI } from '../data/mockData';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [addresses, setAddresses] = useState(DIA_CHI);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState({ duong: '', quan: '', thanhPho: '', isDefault: 0 });
  const [activeTab, setActiveTab] = useState('personal-info');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/auth');
    } else {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        navigate('/auth');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['personal-info', 'addresses', 'password'];
      let currentTab = 'personal-info';

      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3) {
            currentTab = id;
          }
        }
      }
      setActiveTab(currentTab);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const openAddModal = () => {
    setAddrForm({ duong: '', quan: '', thanhPho: '', isDefault: 0 });
    setEditingId(null);
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setAddrForm({ duong: addr.duong, quan: addr.quan, thanhPho: addr.thanhPho, isDefault: addr.isDefault });
    setEditingId(addr.maDiaChi);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      setAddresses(prev => prev.filter(a => a.maDiaChi !== id));
    }
  };

  const handleSetDefault = (id) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.maDiaChi === id ? 1 : 0
    })));
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (editingId) {
      setAddresses(prev => prev.map(a => 
        a.maDiaChi === editingId ? { ...a, ...addrForm } : a
      ));
    } else {
      const isFirst = addresses.length === 0;
      const newAddr = {
        maDiaChi: "addr-" + Date.now(),
        MaNguoiDung: user.maNguoiDung || "user-01",
        ...addrForm,
        isDefault: isFirst ? 1 : 0
      };
      setAddresses([...addresses, newAddr]);
    }
    setShowAddressModal(false);
  };

  if (!user) return null; 

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen pb-24">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ---------------- SIDEBAR ---------------- */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                {/* Dùng icon person mặc định thay vì ảnh */}
                <div className="w-12 h-12 rounded-full bg-[#ec5b13]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#ec5b13] text-2xl">person</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">Chào, {user.fullName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Thành viên Lumina+</p>
                </div>
              </div>
              
              <nav className="p-2 space-y-1">
                <a 
                  onClick={(e) => handleScrollTo(e, 'personal-info')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'personal-info' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="text-sm">Hồ sơ cá nhân</span>
                </a>
                
                <a 
                  onClick={(e) => handleScrollTo(e, 'addresses')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'addresses' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="text-sm">Quản lý địa chỉ</span>
                </a>

                <a 
                  onClick={(e) => handleScrollTo(e, 'password')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'password' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="material-symbols-outlined">lock</span>
                  <span className="text-sm">Đổi mật khẩu</span>
                </a>

                <div className="my-2 border-t border-slate-100"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-left"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-sm font-bold">Đăng xuất</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* ---------------- MAIN CONTENT ---------------- */}
          <section className="flex-1 w-full space-y-8">
            
            {/* THÔNG TIN CÁ NHÂN */}
            <div id="personal-info" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-28">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
                <p className="text-slate-500 mt-1 text-sm">Quản lý thông tin cá nhân của bạn để bảo mật tài khoản</p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Họ và tên</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" defaultValue={user.fullName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                    <div className="relative">
                      <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none font-medium" readOnly type="email" defaultValue={user.email} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Đã xác thực
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số điện thoại</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="tel" defaultValue={user.soDienThoai || ""} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày sinh</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="date" defaultValue={user.ngaySinh || ""} />
                  </div>
                </div>

                {/* Giới tính */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Giới tính</label>
                  <div className="flex gap-8">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input name="gender" type="radio" className="w-4 h-4 text-[#ec5b13] focus:ring-[#ec5b13] border-slate-300" defaultChecked />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#ec5b13] transition-colors">Nam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input name="gender" type="radio" className="w-4 h-4 text-[#ec5b13] focus:ring-[#ec5b13] border-slate-300" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#ec5b13] transition-colors">Nữ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input name="gender" type="radio" className="w-4 h-4 text-[#ec5b13] focus:ring-[#ec5b13] border-slate-300" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#ec5b13] transition-colors">Khác</span>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button type="button" className="w-full md:w-auto px-10 py-3 bg-[#ec5b13] text-white font-bold rounded-xl shadow-lg shadow-[#ec5b13]/30 hover:bg-[#d95210] hover:-translate-y-0.5 transition-all">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
              
              {/* Box Gợi ý bảo mật */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl text-[#ec5b13] shadow-sm">
                    <span className="material-symbols-outlined">loyalty</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Sở thích mua sắm</h4>
                    <p className="text-xs text-slate-600 mt-1">Cập nhật để nhận gợi ý sản phẩm tốt hơn.</p>
                    <a href="#" className="text-xs font-bold text-[#ec5b13] mt-2 inline-block hover:underline">Thiết lập ngay →</a>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm">
                    <span className="material-symbols-outlined">shield_person</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Bảo mật tài khoản</h4>
                    <p className="text-xs text-slate-600 mt-1">Kích hoạt xác thực 2 lớp (2FA) bảo vệ tài khoản.</p>
                    <a href="#" className="text-xs font-bold text-blue-600 mt-2 inline-block hover:underline">Kích hoạt ngay →</a>
                  </div>
                </div>
              </div>
            </div>

            {/* QUẢN LÝ ĐỊA CHỈ */}
            <div id="addresses" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-28">
              <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Địa chỉ giao hàng</h2>
                  <p className="text-slate-500 mt-1 text-sm">Quản lý nơi nhận hàng của bạn</p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors font-bold text-sm border border-slate-200">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="hidden sm:inline">Thêm địa chỉ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    Bạn chưa có địa chỉ giao hàng nào được lưu.
                  </div>
                )}

                {addresses.map((addr) => (
                  <div key={addr.maDiaChi} className={`p-6 rounded-2xl border transition-all ${addr.isDefault === 1 ? 'bg-orange-50/50 border-[#ec5b13]/30 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'} flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#ec5b13] text-[20px]">location_on</span>
                          {user.fullName}
                        </h4>
                        {addr.isDefault === 1 && (
                           <span className="bg-[#ec5b13]/10 text-[#ec5b13] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                             <span className="material-symbols-outlined text-[14px]">verified</span> Mặc định
                           </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{addr.duong}, {addr.quan}, {addr.thanhPho}</p>
                      <p className="text-slate-500 text-sm mt-2 font-medium">{user.soDienThoai}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100/50">
                      <button onClick={() => openEditModal(addr)} className="text-sm font-bold text-[#ec5b13] hover:underline">Sửa</button>
                      <button onClick={() => handleDeleteAddress(addr.maDiaChi)} className="text-sm font-bold text-red-500 hover:underline">Xóa</button>
                      {addr.isDefault !== 1 && (
                        <button onClick={() => handleSetDefault(addr.maDiaChi)} className="text-sm font-bold text-slate-500 hover:text-slate-900 ml-auto border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors">Đặt mặc định</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ĐỔI MẬT KHẨU */}
            <div id="password" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-28">
               <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h2>
                <p className="text-slate-500 mt-1 text-sm">Bảo vệ tài khoản bằng mật khẩu mạnh (ít nhất 8 ký tự).</p>
              </div>
              <form className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu hiện tại</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none" placeholder="••••••••" type="password" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none" placeholder="••••••••" type="password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Xác nhận mật khẩu mới</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none" placeholder="••••••••" type="password" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="button" className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>

          </section>
        </div>
      </main>

      {/* MODAL ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddressModal(false)}></div>
          
          <div className="bg-white relative z-10 w-full max-w-lg p-8 rounded-2xl shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ec5b13]">{editingId ? 'edit_location' : 'add_location'}</span>
                {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveAddress} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đường / Số nhà</label>
                <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" placeholder="VD: 36 Đồng Lễ" value={addrForm.duong} onChange={e => setAddrForm({...addrForm, duong: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quận / Huyện</label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" placeholder="VD: Hạc Thành" value={addrForm.quan} onChange={e => setAddrForm({...addrForm, quan: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thành Phố</label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" placeholder="VD: TP Thanh Hóa" value={addrForm.thanhPho} onChange={e => setAddrForm({...addrForm, thanhPho: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 items-center">
                <button type="button" onClick={() => setShowAddressModal(false)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                <button type="submit" className="bg-[#ec5b13] text-white px-8 py-3 font-bold rounded-xl hover:bg-[#d95210] shadow-lg shadow-[#ec5b13]/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span> Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}