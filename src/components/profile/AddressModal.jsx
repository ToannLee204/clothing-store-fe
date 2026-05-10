import React from 'react';

export default function AddressModal({ 
  show, 
  onClose, 
  editingId, 
  form, 
  setForm, 
  onSave,
  locationTree,
  districtsOptions,
  wardsOptions
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-lumiere-charcoal/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-lumiere-cream w-full max-w-2xl p-8 lg:p-12 border border-lumiere-gray/20 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-lumiere-gray/10">
          <h3 className="serif text-3xl text-lumiere-charcoal">
            {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <button onClick={onClose} className="text-lumiere-gray hover:text-lumiere-charcoal transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Họ tên người nhận *</label>
              <input 
                required 
                className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
                type="text" 
                value={form.fullName} 
                onChange={e => setForm({...form, fullName: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Số điện thoại *</label>
              <input 
                required 
                className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
                type="tel" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Tỉnh / Thành *</label>
              <select 
                required 
                className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48cGF0aCBkPSJNMiA0bDQgNCA0LTQiIHN0cm9rZT0iIzFBMUExQSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-no-repeat bg-[right_16px_center]"
                value={form.province} 
                onChange={e => setForm({...form, province: e.target.value, district: '', ward: ''})}
              >
                <option value="" disabled>Chọn Tỉnh/Thành</option>
                {locationTree.map(p => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Quận / Huyện *</label>
              <select 
                required 
                disabled={!form.province} 
                className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48cGF0aCBkPSJNMiA0bDQgNCA0LTQiIHN0cm9rZT0iIzFBMUExQSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-no-repeat bg-[right_16px_center] disabled:opacity-50"
                value={form.district} 
                onChange={e => setForm({...form, district: e.target.value, ward: ''})}
              >
                <option value="" disabled>Chọn Quận/Huyện</option>
                {districtsOptions.map(d => (
                  <option key={d.code} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Phường / Xã *</label>
              <select 
                required 
                disabled={!form.district} 
                className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48cGF0aCBkPSJNMiA0bDQgNCA0LTQiIHN0cm9rZT0iIzFBMUExQSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-no-repeat bg-[right_16px_center] disabled:opacity-50"
                value={form.ward} 
                onChange={e => setForm({...form, ward: e.target.value})}
              >
                <option value="" disabled>Chọn Phường/Xã</option>
                {wardsOptions.map(w => (
                  <option key={w.code} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] tracking-[0.15em] uppercase font-semibold text-lumiere-gray">Số nhà, tên đường *</label>
            <input 
              required 
              className="w-full bg-white border border-lumiere-gray/20 px-4 py-3 text-[14px] outline-none focus:border-lumiere-charcoal transition-all"
              type="text" 
              placeholder="VD: 123 Nguyễn Huệ" 
              value={form.street} 
              onChange={e => setForm({...form, street: e.target.value})} 
            />
          </div>

          <label className="flex items-center gap-4 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer h-5 w-5 cursor-pointer appearance-none border border-lumiere-gray/30 checked:bg-lumiere-charcoal checked:border-lumiere-charcoal transition-all" 
                checked={form.isDefault} 
                onChange={e => setForm({...form, isDefault: e.target.checked})} 
              />
              <span className="material-symbols-outlined absolute opacity-0 peer-checked:opacity-100 text-white text-[18px] pointer-events-none left-1/2 -translate-x-1/2">check</span>
            </div>
            <span className="text-[13px] font-medium text-lumiere-gray group-hover:text-lumiere-charcoal transition-all">Đặt làm địa chỉ mặc định</span>
          </label>
          
          <div className="pt-10 flex flex-col md:flex-row justify-end gap-4 border-t border-lumiere-gray/10">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-10 py-4 bg-transparent border border-lumiere-gray/30 text-lumiere-gray text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-lumiere-gray hover:text-white transition-all order-2 md:order-1"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-10 py-4 bg-lumiere-terracotta text-white text-[11px] tracking-[0.2em] uppercase font-medium hover:opacity-90 transition-all order-1 md:order-2"
            >
              Lưu địa chỉ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
