import React, { useEffect, useState } from 'react';
import AddressManagement from './AddressManagement';
import AddressModal from './AddressModal';

export default function AddressSection({ user, token }) {
  const [addresses, setAddresses] = useState([]);
  const [locationTree, setLocationTree] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [wardsOptions, setWardsOptions] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState({ 
    fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false 
  });
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  useEffect(() => {
    let timer;
    if (alertModal.isOpen) {
      timer = setTimeout(() => {
        setAlertModal({ isOpen: false, message: '' });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [alertModal.isOpen]);
  useEffect(() => {
    fetchAddresses();
    fetchLocationTree();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
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
    finally { setLoading(false); }
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
      else { setAlertModal({ isOpen: true, message: "Lỗi khi lưu địa chỉ." }); }
    } catch (err) { console.error(err); }
  };

  // const handleDeleteAddress = async (id) => {
  //   if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
  //     try {
  //       const res = await fetch(`/api/v1/addresses/${id}`, {
  //         method: 'DELETE',
  //         headers: { 'Authorization': `Bearer ${token}` }
  //       });
  //       if (res.ok) fetchAddresses();
  //     } catch (err) { console.error(err); }
  //   }
  // };

  // Bước 1: mở confirm
  const handleDeleteAddress = (id) => {
    setConfirmDeleteId(id);
  };

  // Bước 2: user bấm "Xác nhận"
  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/v1/addresses/${confirmDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAddresses();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
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

  return (
    <>
      <AddressManagement 
        addresses={addresses} 
        onAdd={openAddModal} 
        onEdit={openEditModal} 
        onDelete={handleDeleteAddress} 
        onSetDefault={handleSetDefault} 
        loading={loading}
      />
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
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="serif text-xl text-lumiere-charcoal mb-2">Xác nhận xóa</h3>
            <p className="text-[13px] text-lumiere-gray mb-8 leading-relaxed">
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-6 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-gray border border-lumiere-gray/20 hover:border-lumiere-charcoal hover:text-lumiere-charcoal transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all"
              >
                Xóa địa chỉ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Thông báo Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="serif text-xl text-lumiere-charcoal mb-2">Thông báo</h3>
            <p className="text-[13px] text-lumiere-gray mb-8 leading-relaxed">
              {alertModal.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertModal({ isOpen: false, message: '' })}
                className="px-6 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold text-white bg-lumiere-charcoal hover:bg-lumiere-terracotta transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
