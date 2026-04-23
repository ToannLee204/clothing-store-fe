import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // State quản lý Địa chỉ từ Backend
  const [addresses, setAddresses] = useState([]);
  
  // State quản lý API Tỉnh/Thành
  const [locationTree, setLocationTree] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [wardsOptions, setWardsOptions] = useState([]);

  // State điều khiển Modal & Form
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState({ 
    fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false 
  });
  
  const [activeTab, setActiveTab] = useState('personal-info');
  const token = localStorage.getItem('token');

  // ================= 1. KHỞI TẠO DỮ LIỆU =================
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth');
    } else {
      try {
        setUser(JSON.parse(userStr));
        fetchAddresses();
        fetchLocationTree(); // Load cây Tỉnh thành VN
      } catch (error) {
        navigate('/auth');
      }
    }
  }, [navigate]);

  // Scroll Spy (Giữ nguyên)
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['personal-info', 'addresses', 'password'];
      let currentTab = 'personal-info';
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          if (element.getBoundingClientRect().top <= window.innerHeight / 3) {
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

  // ================= 2. GỌI API BACKEND =================
  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/v1/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const rawData = await res.json();

        let addressList = [];
        if (Array.isArray(rawData)) {
          addressList = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          addressList = rawData.data;
        } else if (rawData.result && Array.isArray(rawData.result)) {
          addressList = rawData.result;
        } else if (rawData.content && Array.isArray(rawData.content)) {
          addressList = rawData.content;
        }

        const sorted = addressList.sort((a, b) => {
          const isADefault = a.isDefault || a.default ? 1 : 0;
          const isBDefault = b.isDefault || b.default ? 1 : 0;
          return isBDefault - isADefault;
        });

        setAddresses(sorted);
      }
    } catch (err) {
      console.error("Lỗi lấy địa chỉ:", err);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/v1/addresses/${editingId}` : '/api/v1/addresses';

      const payload = {
        ...addrForm,
        default: addrForm.isDefault,  
        isDefault: addrForm.isDefault   
      };

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload) 
      });

      if (res.ok) {
        fetchAddresses();
        setShowAddressModal(false);
      } else {
        alert("Lỗi khi lưu địa chỉ. Vui lòng kiểm tra lại!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      try {
        const res = await fetch(`/api/v1/addresses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchAddresses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`/api/v1/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= 3. LOGIC API TỈNH/THÀNH =================
  const fetchLocationTree = async () => {
    try {
      // Lấy toàn bộ Tỉnh/Huyện/Xã (depth=3)
      const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
      const data = await res.json();
      setLocationTree(data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu Tỉnh thành:", err);
    }
  };

  // Cập nhật danh sách Quận/Huyện khi Tỉnh/Thành phố thay đổi
  useEffect(() => {
    if (addrForm.province && locationTree.length > 0) {
      const p = locationTree.find(x => x.name === addrForm.province);
      setDistrictsOptions(p ? p.districts : []);
    } else {
      setDistrictsOptions([]);
    }
  }, [addrForm.province, locationTree]);

  // Cập nhật danh sách Phường/Xã khi Quận/Huyện thay đổi
  useEffect(() => {
    if (addrForm.district && districtsOptions.length > 0) {
      const d = districtsOptions.find(x => x.name === addrForm.district);
      setWardsOptions(d ? d.wards : []);
    } else {
      setWardsOptions([]);
    }
  }, [addrForm.district, districtsOptions]);

  // ================= 4. ĐIỀU KHIỂN MODAL =================
  const openAddModal = () => {
    setAddrForm({ 
      fullName: user.fullName || '', 
      phone: user.soDienThoai || '', 
      province: '', district: '', ward: '', street: '', 
      isDefault: addresses.length === 0 
    });
    setEditingId(null);
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setAddrForm({ 
      fullName: addr.fullName, phone: addr.phone, 
      province: addr.province, district: addr.district, ward: addr.ward, street: addr.street, 
      isDefault: addr.isDefault || addr.default 
    });
    setEditingId(addr.id); // API mới dùng ide);
  };

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

  if (!user) return null; 

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ---------------- SIDEBAR ---------------- */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ec5b13]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#ec5b13] text-2xl">person</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">Chào, {user.fullName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Thành viên Lumina+</p>
                </div>
              </div>
              
              <nav className="p-2 space-y-1">
                <a onClick={(e) => handleScrollTo(e, 'personal-info')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'personal-info' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="text-sm">Hồ sơ cá nhân</span>
                </a>
                
                <a onClick={(e) => handleScrollTo(e, 'addresses')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'addresses' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="text-sm">Quản lý địa chỉ</span>
                </a>

                <a onClick={(e) => handleScrollTo(e, 'password')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${activeTab === 'password' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">lock</span>
                  <span className="text-sm">Đổi mật khẩu</span>
                </a>

                <div className="my-2 border-t border-slate-100"></div>
                
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-left">
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

                <div className="pt-6 border-t border-slate-100">
                  <button type="button" className="w-full md:w-auto px-10 py-3 bg-[#ec5b13] text-white font-bold rounded-xl shadow-lg shadow-[#ec5b13]/30 hover:bg-[#d95210] hover:-translate-y-0.5 transition-all">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
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

              <div className="grid grid-cols-1 gap-4">
                {addresses.length === 0 && (
                  <div className="py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    Bạn chưa có địa chỉ giao hàng nào được lưu.
                  </div>
                )}

                {addresses.map((addr) => (
                  <div key={addr.id} className={`p-6 rounded-2xl border transition-all ${addr.isDefault || addr.default ? 'bg-orange-50/50 border-[#ec5b13]/30 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'} flex flex-col justify-between`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {addr.fullName}
                          </h4>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600 font-medium">{addr.phone}</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-1">{addr.street}</p>
                        <p className="text-slate-600 text-sm mt-0.5">{addr.ward}, {addr.district}, {addr.province}</p>
                        
                        {(addr.isDefault || addr.default) && (
                          <span className="inline-flex mt-3 bg-[#ec5b13]/10 text-[#ec5b13] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">verified</span> Mặc định
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEditModal(addr)} className="text-sm font-bold text-[#ec5b13] hover:underline">Sửa</button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm font-bold text-red-500 hover:underline">Xóa</button>
                        </div>
                        {!(addr.isDefault || addr.default) && (
                          <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors">Thiết lập mặc định</button>
                        )}
                      </div>
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
          
          <div className="bg-white relative z-10 w-full max-w-2xl p-8 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              {/* Cột 1: Thông tin người nhận */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Họ tên người nhận <span className="text-red-500">*</span></label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" placeholder="VD: Nguyễn Văn A" value={addrForm.fullName} onChange={e => setAddrForm({...addrForm, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số điện thoại <span className="text-red-500">*</span></label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="tel" placeholder="VD: 0987654321" value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} />
                </div>
              </div>

              {/* Cột 2: Tỉnh / Huyện / Xã */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium truncate" value={addrForm.province} onChange={e => setAddrForm({...addrForm, province: e.target.value, district: '', ward: ''})}>
                    <option value="" disabled>Chọn Tỉnh/Thành</option>
                    {locationTree.map(p => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quận / Huyện <span className="text-red-500">*</span></label>
                  <select required disabled={!addrForm.province} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium disabled:opacity-50 truncate" value={addrForm.district} onChange={e => setAddrForm({...addrForm, district: e.target.value, ward: ''})}>
                    <option value="" disabled>Chọn Quận/Huyện</option>
                    {districtsOptions.map(d => (
                      <option key={d.code} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phường / Xã <span className="text-red-500">*</span></label>
                  <select required disabled={!addrForm.district} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium disabled:opacity-50 truncate" value={addrForm.ward} onChange={e => setAddrForm({...addrForm, ward: e.target.value})}>
                    <option value="" disabled>Chọn Phường/Xã</option>
                    {wardsOptions.map(w => (
                      <option key={w.code} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cột 3: Số nhà */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa chỉ cụ thể (Số nhà, Đường) <span className="text-red-500">*</span></label>
                <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all outline-none font-medium" type="text" placeholder="VD: Số 10, Ngõ 36 Đồng Lễ" value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} />
              </div>

              {/* Mặc định Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <input type="checkbox" className="w-5 h-5 rounded text-[#ec5b13] focus:ring-[#ec5b13] border-slate-300" checked={addrForm.isDefault} onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Đặt làm địa chỉ mặc định</span>
              </label>
              
              <div className="pt-6 flex justify-end gap-3 items-center border-t border-slate-100">
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