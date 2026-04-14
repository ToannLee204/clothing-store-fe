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
      let currentTab = 'personal-info'; // Mặc định ở tab đầu

      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          // Tính toán vị trí của khối so với đỉnh màn hình
          const rect = element.getBoundingClientRect();
          // Nếu đỉnh của khối trồi lên sát 1/3 màn hình phía trên thì tính là đang xem
          if (rect.top <= window.innerHeight / 3) {
            currentTab = id;
          }
        }
      }
      setActiveTab(currentTab);
    };

    // Lắng nghe sự kiện lăn chuột
    window.addEventListener('scroll', handleScroll);
    
    // Chạy mồi luôn 1 phát lúc vừa load trang để nó đánh dấu tab chuẩn
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
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
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
    if (window.confirm("Xóa địa chỉ này nhé?")) {
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
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <main className="pt-32 pb-24 px-12 max-w-[1920px] mx-auto min-h-screen">
        <div className="grid grid-cols-12 gap-16">

          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="sticky top-32 space-y-12">
              <header>
                <h1 className="font-headline text-5xl leading-tight text-primary">Tài khoản<br/>của tôi</h1>
                <p className="font-body text-[0.6875rem] tracking-[0.15em] uppercase mt-6 text-on-surface-variant font-medium leading-relaxed max-w-[200px]">
                  CHÀO MỪNG TRỞ LẠI, {user.fullName}
                </p>
              </header>
              
              <nav className="flex flex-col gap-8 pt-4">
                <a 
                  onClick={(e) => handleScrollTo(e, 'personal-info')}
                  className={`flex items-center gap-5 group cursor-pointer transition-colors ${activeTab === 'personal-info' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
                >
                  <span className="material-symbols-outlined text-[28px] font-light">account_circle</span>
                  <span className={`font-label text-[0.75rem] tracking-widest uppercase border-b-[1.5px] pb-1.5 transition-all ${activeTab === 'personal-info' ? 'border-primary font-bold' : 'border-transparent group-hover:border-primary/50'}`}>
                    Thông tin cá nhân
                  </span>
                </a>
                
                <a 
                  onClick={(e) => handleScrollTo(e, 'addresses')}
                  className={`flex items-center gap-5 group cursor-pointer transition-colors ${activeTab === 'addresses' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
                >
                  <span className="material-symbols-outlined text-[28px] font-light">location_on</span>
                  <span className={`font-label text-[0.75rem] tracking-widest uppercase border-b-[1.5px] pb-1.5 transition-all ${activeTab === 'addresses' ? 'border-primary font-bold' : 'border-transparent group-hover:border-primary/50'}`}>
                    Địa chỉ giao hàng
                  </span>
                </a>

                <a 
                  onClick={(e) => handleScrollTo(e, 'password')}
                  className={`flex items-center gap-5 group cursor-pointer transition-colors ${activeTab === 'password' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
                >
                  <span className="material-symbols-outlined text-[28px] font-light">lock</span>
                  <span className={`font-label text-[0.75rem] tracking-widest uppercase border-b-[1.5px] pb-1.5 transition-all ${activeTab === 'password' ? 'border-primary font-bold' : 'border-transparent group-hover:border-primary/50'}`}>
                    Đổi mật khẩu
                  </span>
                </a>

                <div className="pt-8 mt-4 border-t border-outline-variant/30 w-[80%]">
                  <button onClick={handleLogout} className="flex items-center gap-5 text-on-surface-variant hover:text-primary transition-colors text-left w-full group">
                    <span className="material-symbols-outlined text-[28px] font-light group-hover:-translate-x-1 transition-transform">logout</span>
                    <span className="font-label text-[0.75rem] tracking-widest uppercase font-medium">Đăng xuất</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          <section className="col-span-12 md:col-span-8 lg:col-span-9 space-y-28">
            
            <div className="grid grid-cols-1 gap-12 pt-4" id="personal-info">
              <div className="bg-surface-container-low p-12 w-full border border-outline-variant/10">
                <form className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex flex-col gap-3 group">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Họ tên</label>
                      <input className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm" type="text" defaultValue={user.fullName} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Email</label>
                      <input className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm text-on-surface-variant/70 cursor-not-allowed" type="email" defaultValue={user.email} disabled />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Số điện thoại</label>
                      <input className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm" type="tel" defaultValue={user.soDienThoai || ""} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Ngày sinh</label>
                      <input className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm" type="date" defaultValue={user.ngaySinh || ""} />
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                    <button className="bg-black text-white px-12 py-4 font-label text-[0.6875rem] tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all" type="button">Cập nhật hồ sơ</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-12" id="addresses">
              <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
                <h2 className="font-headline text-3xl">Địa chỉ giao hàng</h2>
                <button onClick={openAddModal} className="flex items-center gap-2 group hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span className="font-label text-[0.6875rem] tracking-widest uppercase border-b border-primary/20 group-hover:border-secondary pb-1">Thêm địa chỉ mới</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {addresses.length === 0 && (
                  <div className="col-span-full py-12 text-center text-on-surface-variant text-sm">
                    Bạn chưa có địa chỉ nào.
                  </div>
                )}

                {addresses.map((addr) => (
                  <div key={addr.maDiaChi} className={`${addr.isDefault === 1 ? 'bg-white shadow-sm border border-outline-variant/10' : 'bg-[#F1EDE8]'} p-10 flex flex-col justify-between min-h-[220px] transition-colors duration-300`}>
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        {addr.isDefault === 1 ? (
                          <>
                            <span className="bg-[#FDDAB1] text-[#785E3D] px-3 py-1 font-label text-[0.55rem] uppercase tracking-widest font-bold">
                              Mặc định
                            </span>
                            <span className="material-symbols-outlined text-[#735A39]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                          </>
                        ) : (
                          <span className="bg-[#E6E2DD] text-[#1C1C19] px-3 py-1 font-label text-[0.55rem] uppercase tracking-widest font-bold">
                            Địa chỉ
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm mb-2">{user.fullName}</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed max-w-[80%]">{addr.duong}, {addr.quan}, {addr.thanhPho}</p>
                      <p className="text-on-surface-variant text-sm mt-2">{user.soDienThoai}</p>
                    </div>
                    
                    <div className="flex gap-6 mt-8">
                      <button onClick={() => openEditModal(addr)} className="font-label text-[0.6rem] uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary pb-1">Sửa</button>
                      <button onClick={() => handleDeleteAddress(addr.maDiaChi)} className="font-label text-[0.6rem] uppercase tracking-widest text-error border-b border-error/20 hover:border-error pb-1">Xóa</button>
                      {addr.isDefault !== 1 && (
                        <button onClick={() => handleSetDefault(addr.maDiaChi)} className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/30 hover:border-primary pb-1 transition-colors">Đặt làm mặc định</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-tertiary-container text-on-tertiary p-12" id="password">
              <div className="max-w-2xl">
                <h2 className="font-headline text-3xl mb-4">Đổi mật khẩu</h2>
                <p className="text-on-tertiary-container text-sm mb-12">Đảm bảo tài khoản của bạn được bảo mật bằng mật khẩu mạnh (ít nhất 8 ký tự, bao gồm chữ cái và số).</p>
                <form className="space-y-8">
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-tertiary-container">Mật khẩu hiện tại</label>
                    <input className="bg-transparent border-b border-outline/30 focus:border-on-tertiary focus:ring-0 outline-none py-2 text-on-tertiary placeholder:text-outline transition-all" placeholder="••••••••" type="password" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-tertiary-container">Mật khẩu mới</label>
                      <input className="bg-transparent border-b border-outline/30 focus:border-on-tertiary focus:ring-0 outline-none py-2 text-on-tertiary placeholder:text-outline transition-all" placeholder="••••••••" type="password" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-tertiary-container">Xác nhận mật khẩu</label>
                      <input className="bg-transparent border-b border-outline/30 focus:border-on-tertiary focus:ring-0 outline-none py-2 text-on-tertiary placeholder:text-outline transition-all" placeholder="••••••••" type="password" />
                    </div>
                  </div>
                  <div className="pt-6">
                    <button className="bg-surface-bright text-primary px-12 py-4 font-label text-[0.6875rem] tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all" type="button">Cập nhật mật khẩu</button>
                  </div>
                </form>
              </div>
            </div>

          </section>
        </div>
      </main>

      {showAddressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddressModal(false)}></div>
          
          <div className="bg-[#FDF9F4] text-on-surface relative z-10 w-full max-w-lg p-10 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline text-2xl">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveAddress} className="space-y-6">
              <div className="flex flex-col gap-3">
                <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Đường / Số nhà</label>
                <input required className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm w-full" type="text" placeholder="VD: 36 Đồng Lễ" value={addrForm.duong} onChange={e => setAddrForm({...addrForm, duong: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Quận / Huyện</label>
                  <input required className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm w-full" type="text" placeholder="VD: Hạc Thành" value={addrForm.quan} onChange={e => setAddrForm({...addrForm, quan: e.target.value})} />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">Thành Phố</label>
                  <input required className="bg-white border border-outline-variant/50 focus:border-black focus:ring-0 outline-none px-4 py-3 transition-all text-sm w-full" type="text" placeholder="VD: TP Thanh Hóa" value={addrForm.thanhPho} onChange={e => setAddrForm({...addrForm, thanhPho: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-8 flex justify-end gap-6 items-center">
                <button type="button" onClick={() => setShowAddressModal(false)} className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant border-b border-transparent hover:border-black transition-colors">Hủy</button>
                <button type="submit" className="bg-black text-white px-8 py-3 font-label text-[0.6875rem] tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}