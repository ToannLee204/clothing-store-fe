import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import AddressManagement from '../components/profile/AddressManagement';
import PasswordForm from '../components/profile/PasswordForm';
import AddressModal from '../components/profile/AddressModal';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [locationTree, setLocationTree] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [wardsOptions, setWardsOptions] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState({ 
    fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false 
  });
  const [activeTab, setActiveTab] = useState('personal-info');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth');
    } else {
      try {
        setUser(JSON.parse(userStr));
        fetchAddresses();
        fetchLocationTree();
      } catch (error) {
        navigate('/auth');
      }
    }
  }, [navigate]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/v1/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const rawData = await res.json();
        let addressList = rawData?.data || rawData?.result || rawData?.content || (Array.isArray(rawData) ? rawData : []);
        setAddresses(addressList.sort((a, b) => (b.isDefault || b.default ? 1 : 0) - (a.isDefault || a.default ? 1 : 0)));
      }
    } catch (err) { console.error("Lỗi lấy địa chỉ:", err); }
  };

  const fetchLocationTree = async () => {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
      const data = await res.json();
      setLocationTree(data);
    } catch (err) { console.error("Lỗi lấy dữ liệu Tỉnh thành:", err); }
  };

  useEffect(() => {
    if (addrForm.province && locationTree.length > 0) {
      const p = locationTree.find(x => x.name === addrForm.province);
      setDistrictsOptions(p ? p.districts : []);
    } else { setDistrictsOptions([]); }
  }, [addrForm.province, locationTree]);

  useEffect(() => {
    if (addrForm.district && districtsOptions.length > 0) {
      const d = districtsOptions.find(x => x.name === addrForm.district);
      setWardsOptions(d ? d.wards : []);
    } else { setWardsOptions([]); }
  }, [addrForm.district, districtsOptions]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/v1/addresses/${editingId}` : '/api/v1/addresses';
      const payload = { ...addrForm, default: addrForm.isDefault, isDefault: addrForm.isDefault };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload) 
      });
      if (res.ok) { fetchAddresses(); setShowAddressModal(false); }
      else { alert("Lỗi khi lưu địa chỉ."); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      try {
        const res = await fetch(`/api/v1/addresses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchAddresses();
      } catch (err) { console.error(err); }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`/api/v1/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAddresses();
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => {
    setAddrForm({ fullName: user.fullName || '', phone: user.soDienThoai || '', province: '', district: '', ward: '', street: '', isDefault: addresses.length === 0 });
    setEditingId(null);
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setAddrForm({ fullName: addr.fullName, phone: addr.phone, province: addr.province, district: addr.district, ward: addr.ward, street: addr.street, isDefault: addr.isDefault || addr.default });
    setEditingId(addr.id);
    setShowAddressModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-lumiere-cream pb-24 pt-32">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          <ProfileSidebar 
            user={user} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout} 
          />

          <main className="flex-1 w-full animate-fade-in">
            {activeTab === 'personal-info' && <PersonalInfoForm user={user} />}
            {activeTab === 'addresses' && (
              <AddressManagement 
                addresses={addresses} 
                onAdd={openAddModal} 
                onEdit={openEditModal} 
                onDelete={handleDeleteAddress} 
                onSetDefault={handleSetDefault} 
              />
            )}
            {activeTab === 'password' && <PasswordForm />}
          </main>
        </div>
      </div>

      <AddressModal 
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        editingId={editingId}
        form={addrForm}
        setForm={setAddrForm}
        onSave={handleSaveAddress}
        locationTree={locationTree}
        districtsOptions={districtsOptions}
        wardsOptions={wardsOptions}
      />
    </div>
  );
}